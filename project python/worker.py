"""
CodexIQ Python Worker
=====================
OCR (Gemini Vision) + Ensemble Değerlendirme (Gemini + Groq + Ollama) + RabbitMQ

Akış:
1. evaluate-exam-queue'dan mesaj alır
2. Görselden öğrenci bilgisi çıkarır (sağ üst köşe)
3. Görselden el yazısı kodu okur
4. 3 model ile paralel değerlendirme yapar
5. Hakem (Gemini) nihai kararı verir
6. Sonucu exam-results-queue'ya gönderir
"""

import asyncio
import json
import os
import sys
import time
import threading
import pika
from PIL import Image
from google import genai
from google.genai import types
from openai import AsyncOpenAI
from pydantic import BaseModel, Field
from typing import Optional

# ============================================================
# KONFIGÜRASYON
# ============================================================

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "AIzaSyApvPYnZsUeTpStZNHCRUXmweamDsrKJkY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "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")

RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "localhost")
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "guest")
RABBITMQ_PASS = os.getenv("RABBITMQ_PASS", "guest")

# .NET'in dosyaları kaydettiği base path
FILE_STORAGE_BASE = os.getenv("FILE_STORAGE_BASE", "C:\\CodexIQ\\Uploads")

LISTEN_QUEUE = "evaluate-exam-queue"
RESULT_QUEUE = "exam-results-queue"

# ============================================================
# PYDANTIC MODELLER (Hakem JSON Schema)
# ============================================================

class HataDetayi(BaseModel):
    satir: str = Field(description="Hatanın bulunduğu satır numarası veya genel konumu")
    hata_turu: str = Field(description="syntax veya logic")
    severity: str = Field(description="error veya warning")
    aciklama: str = Field(description="Hatanın ne olduğu")
    hint: str = Field(description="Öğrenciye verilecek düzeltme ipucu")

class GelisimAlani(BaseModel):
    konu: str = Field(description="Geliştirilmesi gereken konu/kazanım adı")
    mevcut_seviye: int = Field(description="0-100 arası mevcut yetkinlik tahmini")
    oneri: str = Field(description="Bu konuda gelişmek için öğrenciye özel öneri")

class NihaiKararRaporu(BaseModel):
    toplam_puan: int = Field(description="100 üzerinden verilen nihai puan")
    syntax_hatalari: list[HataDetayi] = Field(description="Syntax hatalarının listesi")
    mantik_hatalari: list[HataDetayi] = Field(description="Mantık hatalarının listesi")
    hakem_ozeti: str = Field(description="Hakemin nihai karar özeti - öğrenciye yönelik yapıcı geri bildirim")
    gelisim_alanlari: list[GelisimAlani] = Field(description="Öğrencinin geliştirmesi gereken kazanımlar ve konular")
    genel_degerlendirme: str = Field(description="Öğrencinin güçlü ve zayıf yönlerini özetleyen 2-3 cümlelik genel değerlendirme")

class OgrenciBilgisi(BaseModel):
    first_name: str = Field(default="", description="Öğrencinin adı")
    last_name: str = Field(default="", description="Öğrencinin soyadı")
    student_number: str = Field(default="", description="Öğrenci numarası")

# ============================================================
# OCR - GÖRSEL OKUMA
# ============================================================

class OCRReader:
    """Gemini Vision ile görsel okuma"""

    def __init__(self):
        self.client = genai.Client(api_key=GOOGLE_API_KEY)

    async def extract_student_info(self, image: Image.Image) -> dict:
        """Görselin sağ üst köşesinden öğrenci bilgisini çıkarır"""
        print("  [OCR] Öğrenci bilgisi okunuyor...")

        prompt = """
        Look at the TOP-RIGHT corner of this handwritten exam paper image.
        Students write their name, surname, and student number there.
        
        Extract this information and return ONLY a JSON object:
        {
            "first_name": "student's first name",
            "last_name": "student's last name", 
            "student_number": "student number/ID"
        }
        
        If you cannot find any of these, use empty string "".
        Return ONLY the JSON, no other text.
        """

        try:
            def _run():
                return self.client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=[image, prompt]
                ).text

            result = await asyncio.to_thread(_run)
            result = result.replace("```json", "").replace("```", "").strip()
            parsed = json.loads(result)
            print(f"  [OCR] Öğrenci: {parsed.get('first_name', '')} {parsed.get('last_name', '')} - No: {parsed.get('student_number', '')}")
            return parsed
        except Exception as e:
            print(f"  [OCR] Öğrenci bilgisi okunamadı: {e}")
            return {"first_name": "", "last_name": "", "student_number": ""}

    async def extract_code(self, image: Image.Image) -> str:
        """Görseldeki el yazısı kodu okur"""
        print("  [OCR] El yazısı kod okunuyor...")

        prompt = """
        You are a strict, high-precision data transcription engine. 
        Your task is to transcribe handwritten programming code from an image exactly as it appears, with no alterations.

        # Critical Constraints
        * ZERO AUTOCORRECT: Do not correct any spelling, syntax, or logical errors. Transcribe typos exactly as written.
        * PRESERVE INDENTATION: Perfectly replicate the spatial arrangement, including all leading spaces and line breaks.
        * NO INFERENCE: Do not add missing punctuation that are not clearly visible.
        * IGNORE the student info area (top-right corner with name/number). Only transcribe the CODE portion.

        # Output Format
        Output ONLY the raw transcribed code text. No markdown code blocks, no explanations.
        """

        try:
            def _run():
                return self.client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=[image, prompt]
                ).text

            result = await asyncio.to_thread(_run)
            result = result.replace("```python", "").replace("```c", "").replace("```cpp", "")
            result = result.replace("```java", "").replace("```javascript", "").replace("```", "").strip()
            print(f"  [OCR] Kod okundu ({len(result)} karakter)")
            return result
        except Exception as e:
            print(f"  [OCR] Kod okunamadı: {e}")
            return ""

# ============================================================
# ENSEMBLE DEĞERLENDİRME
# ============================================================

class EnsembleEvaluator:
    """3 model + hakem ile değerlendirme"""

    def __init__(self):
        self.gemini_client = genai.Client(api_key=GOOGLE_API_KEY)
        self.groq_client = AsyncOpenAI(
            api_key=GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1"
        )

    def _build_eval_prompt(self, student_code: str, teacher_context: str, language: str) -> str:
        return f"""
        You are an expert, fair, and encouraging computer science professor evaluating a student's handwritten code.
        The code was written in {language} programming language.
        
        ## Context & Rubric (provided by teacher):
        {teacher_context}
        
        ## Student's Raw OCR Code:
        {student_code}
        
        ## Instructions:
        1. Analyze the logic first. If the student solved the problem correctly using ANY valid method, award full logic points.
        2. Apply "OCR and Handwriting Tolerance" - do not deduct for missing indentation if logical blocks are clear.
        3. Identify syntax errors (wrong keywords, missing brackets, etc.) separately from logic errors (wrong algorithm, missing edge cases).
        4. For each error, specify: line number/location, type (syntax/logic), severity (error/warning), description, and a helpful hint.
        5. Write a detailed assessment report.
        
        ## CRITICAL - SCORE FORMAT:
        You MUST end your response with EXACTLY this line (nothing else after it):
        FINAL_SCORE: [your score]/100
        
        Example: FINAL_SCORE: 85/100
        """

    async def _jury_gemini(self, prompt: str) -> tuple[str, int]:
        """Gemini jüri değerlendirmesi"""
        print("  [Jüri 1] Gemini analiz ediyor...")
        try:
            def _run():
                return self.gemini_client.models.generate_content(
                    model='gemini-2.5-flash', contents=prompt
                ).text
            rapor = await asyncio.to_thread(_run)
            score = self._extract_score(rapor)
            return rapor, score
        except Exception as e:
            print(f"  [Jüri 1] Gemini hatası: {e}")
            return f"Gemini bağlantı hatası: {e}", 0

    async def _jury_groq(self, prompt: str) -> tuple[str, int]:
        """Groq (Llama) jüri değerlendirmesi"""
        print("  [Jüri 2] Groq (Llama) analiz ediyor...")
        try:
            response = await self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2
            )
            rapor = response.choices[0].message.content
            score = self._extract_score(rapor)
            return rapor, score
        except Exception as e:
            print(f"  [Jüri 2] Groq hatası: {e}")
            return f"Groq bağlantı hatası: {e}", 0

    async def _jury_ollama(self, prompt: str) -> tuple[str, int]:
        """Ollama (Llama local) jüri değerlendirmesi"""
        print("  [Jüri 3] Ollama (Llama) analiz ediyor...")
        try:
            import ollama
            client = ollama.AsyncClient()
            response = await client.generate(model='llama3.1', prompt=prompt)
            rapor = response['response']
            score = self._extract_score(rapor)
            return rapor, score
        except Exception as e:
            print(f"  [Jüri 3] Ollama hatası: {e}")
            return f"Ollama bağlantı hatası: {e}", 0

    def _extract_score(self, text: str) -> int:
        """Rapor metninden skoru çıkarmaya çalışır — önce FINAL_SCORE formatını arar"""
        import re
        
        # 1. Öncelik: FINAL_SCORE formatı (en güvenilir)
        final_match = re.search(r'FINAL_SCORE\s*:\s*(\d{1,3})\s*/\s*100', text, re.IGNORECASE)
        if final_match:
            score = int(final_match.group(1))
            if 0 <= score <= 100:
                return score
        
        # 2. "Overall Score" veya "Final Score" kalıpları
        overall_patterns = [
            r'(?:overall|final|total)\s*score\s*[:\-=]\s*(\d{1,3})\s*/\s*100',
            r'(?:overall|final|total)\s*score\s*[:\-=]\s*(\d{1,3})',
            r'(?:overall|final|total)\s*[:\-=]\s*(\d{1,3})\s*/\s*100',
        ]
        for pattern in overall_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                score = int(match.group(1))
                if 0 <= score <= 100:
                    return score
        
        # 3. Son satırlardaki skor (raporun sonunda olma ihtimali yüksek)
        lines = text.strip().split('\n')
        last_lines = lines[-5:] if len(lines) >= 5 else lines
        last_text = '\n'.join(last_lines)
        
        score_match = re.search(r'(\d{1,3})\s*/\s*100', last_text)
        if score_match:
            score = int(score_match.group(1))
            if 0 <= score <= 100:
                return score
        
        # 4. Fallback: tüm metindeki X/100 kalıplarından en sonuncusu
        all_matches = re.findall(r'(\d{1,3})\s*/\s*100', text)
        if all_matches:
            score = int(all_matches[-1])  # son bulunan (genelde nihai skor)
            if 0 <= score <= 100:
                return score
        
        return 0

    async def _judge_evaluate(self, reports: str, teacher_context: str, student_code: str, language: str) -> str:
        """Hakem nihai kararı"""
        print("  [HAKEM] Nihai karar veriliyor...")

        hakem_prompt = f"""
        You are the Master Judge (Chief Professor) in a computer science evaluation panel.
        Three different AI teaching assistants have evaluated a student's handwritten {language} code.
        
        ## Context & Rubric:
        {teacher_context}
        
        ## Student's Raw OCR Code:
        {student_code}
        
        ## Assistant Reports:
        {reports}
        
        ## Instructions:
        1. Synthesize the three reports. Resolve any conflicts in scoring.
        2. Apply "OCR and Handwriting Tolerance" - overrule any assistant that unfairly penalized for OCR artifacts.
        3. For EVERY error you confirm, provide:
           - satir: line number or location
           - hata_turu: "syntax" or "logic"
           - severity: "error" or "warning"  
           - aciklama: clear description
           - hint: helpful, encouraging hint for the student to fix it
        4. Identify 3-5 areas where the student should improve (gelisim_alanlari). For each:
           - konu: topic name (e.g., "Pointer Kullanımı", "Bellek Yönetimi", "Hata Yakalama")
           - mevcut_seviye: estimated current proficiency 0-100
           - oneri: specific, actionable advice for improvement
        5. Write a genel_degerlendirme: 2-3 sentence summary of student's strengths and weaknesses.
        6. Write a hakem_ozeti: your overall feedback to the student (encouraging, constructive).
        7. Output your final evaluation strictly matching the requested JSON schema.
        """

        try:
            def _run():
                return self.gemini_client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=hakem_prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=NihaiKararRaporu,
                        temperature=0.1
                    )
                )
            response = await asyncio.to_thread(_run)
            return response.text
        except Exception as e:
            print(f"  [HAKEM] Hata: {e}")
            # Fallback: Kullanıcı dostu bir hata mesajı ile JSON döndür
            return json.dumps({
                "toplam_puan": 0,
                "syntax_hatalari": [],
                "mantik_hatalari": [],
                "hakem_ozeti": "Değerlendirme sırasında bir sistem hatası oluştu. Lütfen daha sonra tekrar deneyin veya bir yönetici ile iletişime geçin.",
                "gelisim_alanlari": [],
                "genel_degerlendirme": "Değerlendirme tamamlanamadı."
            })

    async def evaluate(self, student_code: str, teacher_context: str, language: str) -> dict:
        """Tam ensemble değerlendirme"""
        prompt = self._build_eval_prompt(student_code, teacher_context, language)

        # 3 jüri paralel çalışır
        results = await asyncio.gather(
            self._jury_gemini(prompt),
            self._jury_groq(prompt),
            self._jury_ollama(prompt),
            return_exceptions=True
        )

        reports = []
        model_scores = {}

        jury_names = ["gemini", "groq_llama", "ollama_llama"]
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                reports.append(f"--- {jury_names[i].upper()} RAPORU ---\nHata: {result}\n")
                model_scores[jury_names[i]] = 0
            else:
                rapor, score = result
                reports.append(f"--- {jury_names[i].upper()} RAPORU ---\n{rapor}\n")
                model_scores[jury_names[i]] = score

        all_reports = "\n\n".join(reports)

        # Hakem kararı
        judge_json = await self._judge_evaluate(all_reports, teacher_context, student_code, language)

        try:
            judge_result = json.loads(judge_json)
        except json.JSONDecodeError:
            judge_result = {
                "toplam_puan": 0,
                "syntax_hatalari": [],
                "mantik_hatalari": [],
                "hakem_ozeti": "JSON parse hatası",
                "gelisim_alanlari": [],
                "genel_degerlendirme": "Değerlendirme tamamlanamadı."
            }

        return {
            "evaluation": judge_result,
            "modelScores": model_scores
        }

# ============================================================
# RABBITMQ WORKER
# ============================================================

class CodexIQWorker:
    """Ana worker sınıfı — RabbitMQ dinler, OCR + Ensemble yapar, sonuç gönderir"""

    def __init__(self):
        self.ocr = OCRReader()
        self.evaluator = EnsembleEvaluator()
        self.connection = None
        self.channel = None

    def connect(self):
        """RabbitMQ bağlantısı kur"""
        credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
        parameters = pika.ConnectionParameters(
            host=RABBITMQ_HOST,
            credentials=credentials,
            heartbeat=600,
            blocked_connection_timeout=300
        )
        self.connection = pika.BlockingConnection(parameters)
        self.channel = self.connection.channel()

        # Kuyrukları tanımla
        self.channel.queue_declare(queue=LISTEN_QUEUE, durable=True)
        self.channel.queue_declare(queue=RESULT_QUEUE, durable=True)
        self.channel.basic_qos(prefetch_count=1)

        print(f" [*] CodexIQ Python Worker Aktif")
        print(f" [*] Kuyruk dinleniyor: {LISTEN_QUEUE}")
        print(f" [*] Sonuç kuyruğu: {RESULT_QUEUE}")
        print(f" [*] Dosya yolu: {FILE_STORAGE_BASE}")

    def _send_result(self, result: dict):
        """Sonucu .NET'e gönder"""
        self.channel.basic_publish(
            exchange='',
            routing_key=RESULT_QUEUE,
            body=json.dumps(result, ensure_ascii=False),
            properties=pika.BasicProperties(
                content_type='application/json',
                delivery_mode=2,
            )
        )
        print(f"  [→] Sonuç .NET'e gönderildi")

    def _send_error(self, exam_paper_id: str, exam_id: str, error_msg: str):
        """Hata durumunda .NET'e bilgi gönder"""
        error_result = {
            "examPaperId": exam_paper_id,
            "examId": exam_id,
            "studentInfo": {"first_name": "", "last_name": "", "student_number": ""},
            "extractedCode": "",
            "evaluation": {
                "toplam_puan": 0,
                "syntax_hatalari": [],
                "mantik_hatalari": [],
                "hakem_ozeti": f"Değerlendirme hatası: {error_msg}",
                "gelisim_alanlari": [],
                "genel_degerlendirme": "Değerlendirme tamamlanamadı."
            },
            "modelScores": {"gemini": 0, "groq_llama": 0, "ollama_llama": 0},
            "status": "failed"
        }
        self._send_result(error_result)

    async def _process_paper(self, message: dict):
        """Tek bir sınav kağıdını işle"""
        exam_id = message.get("examId", "")
        exam_paper_id = message.get("examPaperId", "")
        image_path = message.get("imagePath", "")
        teacher_context = message.get("teacherContext", "")
        language = message.get("programmingLanguage", "unknown")

        print(f"\n{'='*60}")
        print(f"  YENİ KAĞIT İŞLENİYOR")
        print(f"  Sınav ID: {exam_id}")
        print(f"  Kağıt ID: {exam_paper_id}")
        print(f"  Dil: {language}")
        print(f"{'='*60}")

        # 1. Görseli yükle
        full_path = os.path.join(FILE_STORAGE_BASE, image_path.replace("/", os.sep).replace("\\", os.sep))
        print(f"  [1/4] Görsel yükleniyor: {full_path}")

        if not os.path.exists(full_path):
            print(f"  [HATA] Dosya bulunamadı: {full_path}")
            self._send_error(exam_paper_id, exam_id, f"Dosya bulunamadı: {image_path}")
            return

        try:
            image = Image.open(full_path)
        except Exception as e:
            print(f"  [HATA] Görsel açılamadı: {e}")
            self._send_error(exam_paper_id, exam_id, f"Görsel açılamadı: {e}")
            return

        # 2. OCR — Öğrenci bilgisi + Kod okuma (paralel)
        print(f"  [2/4] OCR işlemi başlıyor...")
        student_info, extracted_code = await asyncio.gather(
            self.ocr.extract_student_info(image),
            self.ocr.extract_code(image)
        )

        if not extracted_code:
            print(f"  [HATA] Kod okunamadı")
            self._send_error(exam_paper_id, exam_id, "Kod okunamadı")
            return

        # 3. Öğretmen context'i oluştur
        if not teacher_context:
            teacher_context = f"""
            Evaluate the {language} code written by the student.
            Check for correctness, syntax errors, and logic errors.
            Score out of 100.
            
            ## CRITICAL: OCR and Handwriting Tolerance
            The code was digitized from handwritten exam papers via OCR.
            * Do not penalize for missing indentation if logical blocks are clear.
            * Forgive minor handwriting artifacts but penalize actual keyword typos.
            """

        # 4. Ensemble değerlendirme
        print(f"  [3/4] Ensemble değerlendirme başlıyor...")
        eval_result = await self.evaluator.evaluate(extracted_code, teacher_context, language)

        # 5. Sonuç paketi oluştur
        print(f"  [4/4] Sonuç paketi hazırlanıyor...")
        result = {
            "examPaperId": exam_paper_id,
            "examId": exam_id,
            "studentInfo": {
                "firstName": student_info.get("first_name", ""),
                "lastName": student_info.get("last_name", ""),
                "studentNumber": student_info.get("student_number", "")
            },
            "extractedCode": extracted_code,
            "evaluation": eval_result["evaluation"],
            "modelScores": eval_result["modelScores"],
            "status": "completed"
        }

        # Sonucu gönder
        self._send_result(result)

        puan = eval_result["evaluation"].get("toplam_puan", 0)
        syntax_count = len(eval_result["evaluation"].get("syntax_hatalari", []))
        logic_count = len(eval_result["evaluation"].get("mantik_hatalari", []))
        gelisim_count = len(eval_result["evaluation"].get("gelisim_alanlari", []))

        print(f"\n  ✅ İŞLEM TAMAMLANDI")
        print(f"  Öğrenci: {student_info.get('first_name', '?')} {student_info.get('last_name', '?')}")
        print(f"  Puan: {puan}/100")
        print(f"  Syntax Hata: {syntax_count} | Mantık Hata: {logic_count}")
        print(f"  Gelişim Alanı: {gelisim_count}")
        print(f"{'='*60}\n")

    def _callback(self, ch, method, properties, body):
        """RabbitMQ mesaj callback'i"""
        try:
            # MassTransit envelope formatını parse et
            raw = json.loads(body)

            # MassTransit mesajı "message" anahtarı altında gönderir
            if "message" in raw:
                message = raw["message"]
            else:
                message = raw

            print(f"\n [←] Yeni mesaj alındı: ExamPaper={message.get('examPaperId', 'N/A')}")

            # Async işlemi çalıştır
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                loop.run_until_complete(self._process_paper(message))
            finally:
                loop.close()

            ch.basic_ack(delivery_tag=method.delivery_tag)

        except Exception as e:
            print(f" [HATA] Mesaj işlenirken hata: {e}")
            import traceback
            traceback.print_exc()
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    def start(self):
        """Worker'ı başlat"""
        self.connect()
        self.channel.basic_consume(
            queue=LISTEN_QUEUE,
            on_message_callback=self._callback
        )
        print(f"\n {'='*60}")
        print(f"  CodexIQ AI Worker v2.0")
        print(f"  Modeller: Gemini 2.5 Flash + Groq Llama 3.3 + Ollama Llama 3.1")
        print(f"  Hakem: Gemini 2.5 Flash")
        print(f" {'='*60}")
        print(f" [*] Sınavlar bekleniyor... (Çıkmak için CTRL+C)\n")

        try:
            self.channel.start_consuming()
        except KeyboardInterrupt:
            print("\n [!] Worker durduruluyor...")
            self.channel.stop_consuming()
            self.connection.close()
            print(" [x] Worker durduruldu.")

# ============================================================
# BAŞLAT
# ============================================================

if __name__ == "__main__":
    worker = CodexIQWorker()
    worker.start()