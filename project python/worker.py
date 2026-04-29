"""
CodexIQ Python Worker
=====================
OCR (Gemini Vision) + Ensemble (Gemini + Groq + OpenRouter DeepSeek) + RabbitMQ

Modeller (tamamı ücretsiz):
- OCR + Jüri 1: Gemini 2.0 Flash (Google AI Studio)
- Jüri 2:       Groq Llama 3.3 70B
- Jüri 3:       OpenRouter DeepSeek V3 (free tier)
- Hakem:        Groq Llama 3.3 70B (JSON mode) + Gemini fallback

Akış:
1. evaluate-exam-queue'dan mesaj alır
2. Görselden öğrenci bilgisi çıkarır (sağ üst köşe)
3. Görselden el yazısı kodu okur
4. 3 model ile paralel değerlendirme yapar
5. Hakem nihai kararı verir
6. Sonucu exam-results-queue'ya gönderir
"""

import asyncio
import io
import json
import os
import re
import sys
import time
import threading
import pika
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from PIL import Image, ImageFile, ImageEnhance, ImageFilter

# Truncated JPEG/PNG dosyalarını da oku (son birkaç byte eksik olsa bile)
ImageFile.LOAD_TRUNCATED_IMAGES = True
from google import genai
from google.genai import types
from openai import AsyncOpenAI
from pydantic import BaseModel, Field
from typing import Optional

# .env dosyasını yükle (API keyleri burada)
load_dotenv()

# ============================================================
# KONFIGÜRASYON
# ============================================================

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

if not GOOGLE_API_KEY:
    raise EnvironmentError("GOOGLE_API_KEY ortam değişkeni bulunamadı! .env dosyasını kontrol et.")
if not GROQ_API_KEY:
    raise EnvironmentError("GROQ_API_KEY ortam değişkeni bulunamadı! .env dosyasını kontrol et.")
if not OPENROUTER_API_KEY:
    raise EnvironmentError("OPENROUTER_API_KEY ortam değişkeni bulunamadı! openrouter.ai'dan ücretsiz key alıp .env'e ekle.")

RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "localhost")
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "guest")
RABBITMQ_PASS = os.getenv("RABBITMQ_PASS", "guest")

# .NET'in dosyaları kaydettiği base path
FILE_STORAGE_BASE = os.getenv("FILE_STORAGE_BASE", "C:\\CodexIQ\\Uploads")

LISTEN_QUEUE = "e" \
"valuate-exam-queue"
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

def _parse_retry_delay(error: Exception) -> float:
    """Gemini 429 hatasından retryDelay süresini saniye cinsinden çıkarır."""
    text = str(error)
    # "retryDelay": "14s" veya "Please retry in 14.3s"
    match = re.search(r'[Rr]etry[Dd]elay["\s:]+(\d+(?:\.\d+)?)\s*s', text)
    if match:
        return float(match.group(1)) + 1.0
    match = re.search(r'[Rr]etry in (\d+(?:\.\d+)?)\s*s', text)
    if match:
        return float(match.group(1)) + 1.0
    return 15.0  # bulunamazsa varsayılan


def _preprocess_image(image_bytes: bytes) -> bytes:
    """
    PIL ile görüntü ön işleme:
    - Gri tonlamaya çevir (renk gürültüsünü azaltır)
    - Kontrast artır (soluk el yazısını belirginleştirir)
    - Keskinleştir (bulanık harfleri netleştirir)
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Gri tonlama → kontrast artırma → keskinleştirme → RGB'ye geri dön
    gray = img.convert("L")
    enhanced = ImageEnhance.Contrast(gray).enhance(2.0)
    sharpened = enhanced.filter(ImageFilter.SHARPEN)
    final = sharpened.convert("RGB")

    buf = io.BytesIO()
    final.save(buf, format="PNG")
    return buf.getvalue()


class OCRReader:
    """Gemini Vision (+ Groq Vision fallback) ile görsel okuma"""

    def __init__(self):
        self.gemini_client = genai.Client(api_key=GOOGLE_API_KEY)
        self.groq_client = AsyncOpenAI(
            api_key=GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1"
        )

    async def extract_student_info(self, image_bytes: bytes) -> dict:
        """Görselin sağ üst köşesinden öğrenci bilgisini çıkarır"""
        print("  [OCR] Öğrenci bilgisi okunuyor...")

        prompt = """
        Look at the TOP-RIGHT corner of this handwritten exam paper image.
        Students write their name, surname, and student number there.

        Common ambiguous characters to watch for: 0 vs O, 1 vs l vs I, 5 vs S.
        Student numbers are typically 10 digits long.

        Extract this information and return ONLY a JSON object:
        {
            "first_name": "student's first name",
            "last_name": "student's last name",
            "student_number": "student number/ID (digits only)"
        }

        If you cannot find any of these, use empty string "".
        Return ONLY the JSON, no other text.
        """

        # Ham ve ön işlenmiş görüntüleri dene
        raw_part = types.Part.from_bytes(data=image_bytes, mime_type="image/png")
        processed_bytes = _preprocess_image(image_bytes)
        proc_part = types.Part.from_bytes(data=processed_bytes, mime_type="image/png")

        for attempt in range(1, 4):
            image_part = raw_part if attempt == 1 else proc_part
            try:
                def _run(part=image_part):
                    return self.gemini_client.models.generate_content(
                        model='gemini-2.5-flash',
                        contents=[part, prompt]
                    ).text

                result = await asyncio.to_thread(_run)
                result = result.replace("```json", "").replace("```", "").strip()
                parsed = json.loads(result)
                print(f"  [OCR] Öğrenci: {parsed.get('first_name', '')} {parsed.get('last_name', '')} - No: {parsed.get('student_number', '')}")
                return parsed
            except Exception as e:
                err_str = str(e)
                is_quota = "429" in err_str or "RESOURCE_EXHAUSTED" in err_str
                if attempt < 3:
                    wait = _parse_retry_delay(e) if is_quota else attempt * 5
                    print(f"  [OCR] Öğrenci bilgisi deneme {attempt} başarısız ({'kota' if is_quota else 'hata'}), {wait:.0f}s bekleniyor...")
                    await asyncio.sleep(wait)
                else:
                    # Groq Vision fallback
                    print(f"  [OCR] Gemini başarısız, Groq Vision fallback deneniyor...")
                    try:
                        result = await self._groq_extract_student_info(processed_bytes, prompt)
                        return result
                    except Exception as groq_err:
                        print(f"  [OCR] Öğrenci bilgisi okunamadı (Groq da başarısız): {groq_err}")
                        return {"first_name": "", "last_name": "", "student_number": ""}

    async def _groq_extract_student_info(self, image_bytes: bytes, prompt: str) -> dict:
        import base64
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        response = await self.groq_client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}},
                    {"type": "text", "text": prompt}
                ]
            }],
            max_tokens=200,
            temperature=0.1
        )
        text = response.choices[0].message.content or ""
        text = text.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(text)
        print(f"  [OCR/Groq] Öğrenci: {parsed.get('first_name', '')} {parsed.get('last_name', '')} - No: {parsed.get('student_number', '')}")
        return parsed

    async def extract_code(self, image_bytes: bytes, language: str = "unknown") -> str:
        """Görseldeki el yazısı kodu okur — ön işleme + dile özgü prompt + Groq fallback"""
        print("  [OCR] El yazısı kod okunuyor...")

        lang_hint = {
            "python": "Python code. Pay close attention to indentation (spaces/tabs define blocks). Watch for: ':' at end of if/for/def/while lines, '==' vs '=', '**' for power.",
            "java": "Java code. Watch for: '{' and '}' block delimiters, ';' at end of statements, type declarations.",
            "c": "C code. Watch for: '{' and '}', ';' at end of statements, '*' for pointers, '->' operator.",
            "cpp": "C++ code. Watch for: '{' and '}', ';', '<<' and '>>' operators, '::' scope resolution.",
            "javascript": "JavaScript code. Watch for: '{' and '}', '=>' arrow functions, '===' vs '=='.",
        }.get(language.lower(), f"{language} code.")

        prompt = f"""
        You are a strict, high-precision data transcription engine.
        Your task is to transcribe handwritten programming code from an image exactly as it appears.

        ## Language Context
        This is {lang_hint}

        ## Ambiguous Character Guide
        When a character is unclear, use context to decide:
        - 0 (zero) vs O (letter O): digits in numbers → 0, variable names → O
        - 1 (one) vs l (lowercase L) vs I (uppercase i): numbers → 1, identifiers → l or I
        - 5 vs S: numbers → 5, identifiers → S

        ## Critical Rules
        * ZERO AUTOCORRECT: Transcribe typos exactly as written. Do NOT fix errors.
        * PRESERVE INDENTATION: Replicate all leading spaces and line breaks faithfully.
        * NO INFERENCE: Do not add brackets, colons, or punctuation not clearly visible.
        * IGNORE the student info area (top-right corner with name/number).

        ## Output Format
        Output ONLY the raw transcribed code. No markdown, no explanations.
        """

        processed_bytes = _preprocess_image(image_bytes)
        raw_part  = types.Part.from_bytes(data=image_bytes,       mime_type="image/png")
        proc_part = types.Part.from_bytes(data=processed_bytes,   mime_type="image/png")

        for attempt in range(1, 4):
            # İlk denemede ham görüntü, sonrasında ön işlenmiş
            image_part = raw_part if attempt == 1 else proc_part
            try:
                def _run(part=image_part):
                    return self.gemini_client.models.generate_content(
                        model='gemini-2.5-flash',
                        contents=[part, prompt]
                    ).text

                result = await asyncio.to_thread(_run)
                for lang_tag in ["```python", "```java", "```c", "```cpp", "```javascript", "```"]:
                    result = result.replace(lang_tag, "")
                result = result.strip()
                print(f"  [OCR] Kod okundu ({len(result)} karakter)")
                return result
            except Exception as e:
                err_str = str(e)
                is_quota = "429" in err_str or "RESOURCE_EXHAUSTED" in err_str
                if attempt < 3:
                    wait = _parse_retry_delay(e) if is_quota else attempt * 5
                    print(f"  [OCR] Kod okuma deneme {attempt} başarısız ({'kota' if is_quota else 'hata'}), {wait:.0f}s bekleniyor...")
                    await asyncio.sleep(wait)
                else:
                    # Groq Vision fallback
                    print(f"  [OCR] Gemini başarısız, Groq Vision fallback deneniyor...")
                    try:
                        result = await self._groq_extract_code(processed_bytes, prompt)
                        return result
                    except Exception as groq_err:
                        print(f"  [OCR] Kod okunamadı (Groq da başarısız): {groq_err}")
                        return ""

    async def _groq_extract_code(self, image_bytes: bytes, prompt: str) -> str:
        import base64
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        response = await self.groq_client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}},
                    {"type": "text", "text": prompt}
                ]
            }],
            max_tokens=1500,
            temperature=0.1
        )
        text = response.choices[0].message.content or ""
        for lang_tag in ["```python", "```java", "```c", "```cpp", "```javascript", "```"]:
            text = text.replace(lang_tag, "")
        text = text.strip()
        print(f"  [OCR/Groq] Kod okundu ({len(text)} karakter)")
        return text

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
        self.openrouter_client = AsyncOpenAI(
            api_key=OPENROUTER_API_KEY,
            base_url="https://openrouter.ai/api/v1"
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
        """Gemini jüri değerlendirmesi — 2 deneme"""
        print("  [Jüri 1] Gemini analiz ediyor...")
        last_err = None
        for attempt in range(1, 3):
            try:
                def _run():
                    return self.gemini_client.models.generate_content(
                        model='gemini-2.5-flash', contents=prompt
                    ).text
                rapor = await asyncio.to_thread(_run)
                score = self._extract_score(rapor)
                return rapor, score
            except Exception as e:
                last_err = e
                if attempt < 2:
                    await asyncio.sleep(3)
        print(f"  [Jüri 1] Gemini hatası: {last_err}")
        return f"Gemini bağlantı hatası: {last_err}", 0

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

    async def _jury_deepseek(self, prompt: str) -> tuple[str, int]:
        """OpenRouter DeepSeek V3 (free) jüri değerlendirmesi"""
        print("  [Jüri 3] OpenRouter DeepSeek V3 analiz ediyor...")
        last_err = None
        for attempt in range(1, 3):
            try:
                response = await self.openrouter_client.chat.completions.create(
                    model="deepseek/deepseek-chat-v3-0324:free",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.2,
                    extra_headers={
                        "HTTP-Referer": "https://codexiq.local",
                        "X-Title": "CodexIQ"
                    }
                )
                rapor = response.choices[0].message.content or ""
                score = self._extract_score(rapor)
                return rapor, score
            except Exception as e:
                last_err = e
                if attempt < 2:
                    await asyncio.sleep(3)
        print(f"  [Jüri 3] DeepSeek hatası: {last_err}")
        return f"DeepSeek bağlantı hatası: {last_err}", 0

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
        """Hakem nihai kararı — 3 deneme, sonra Groq fallback"""
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

        # PRIMARY: Groq (JSON mode) — hızlı ve stabil
        groq_hakem_prompt = hakem_prompt + "\n\nIMPORTANT: Your response MUST be valid JSON matching this schema exactly:\n" + json.dumps(NihaiKararRaporu.model_json_schema(), ensure_ascii=False)
        for attempt in range(1, 3):
            try:
                response = await self.groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": "You are a strict JSON-only responder. Output only valid JSON, no other text."},
                        {"role": "user", "content": groq_hakem_prompt}
                    ],
                    temperature=0.1,
                    response_format={"type": "json_object"}
                )
                print(f"  [HAKEM] Groq başarılı")
                return response.choices[0].message.content
            except Exception as groq_err:
                print(f"  [HAKEM] Groq deneme {attempt} başarısız: {groq_err}")
                if attempt < 2:
                    await asyncio.sleep(3)

        # FALLBACK: Gemini structured output
        print(f"  [HAKEM] Groq başarısız, Gemini fallback devreye alınıyor...")
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
            print(f"  [HAKEM] Gemini fallback başarılı")
            return response.text
        except Exception as gem_err:
            print(f"  [HAKEM] Gemini fallback da başarısız: {gem_err}")
            return json.dumps({
                "toplam_puan": 0,
                "syntax_hatalari": [],
                "mantik_hatalari": [],
                "hakem_ozeti": f"Tüm hakem modelleri geçici olarak kullanılamıyor. Lütfen tekrar deneyin.",
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
            self._jury_deepseek(prompt),
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

        # Hakem 0 verdiyse ama en az 1 jüri başarılıysa → başarılı jürilerin ortalamasını kullan
        if judge_result.get("toplam_puan", 0) == 0:
            successful_scores = [s for s in model_scores.values() if s > 0]
            if successful_scores:
                fallback_score = round(sum(successful_scores) / len(successful_scores))
                print(f"  [HAKEM] Hakem skoru 0 — jüri ortalaması kullanılıyor: {fallback_score}/100 ({successful_scores})")
                judge_result["toplam_puan"] = fallback_score
                judge_result["hakem_ozeti"] = (
                    f"(Hakem modeli geçici olarak kullanılamadı. Aktif jüri ortalaması: {fallback_score}/100) "
                    + judge_result.get("hakem_ozeti", "")
                )

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
            # PIL ile aç (LOAD_TRUNCATED_IMAGES=True sayesinde truncated JPEG tolere edilir)
            pil_image = Image.open(full_path)
            pil_image.load()  # Tüm piksel verisini belleğe oku
            # PNG olarak BytesIO'ya yaz: artık eksiksiz, bellekte, dosya bağlantısı yok
            buf = io.BytesIO()
            pil_image.convert("RGB").save(buf, format="PNG")
            image_bytes = buf.getvalue()
            print(f"  [Görsel] {len(image_bytes)//1024} KB PNG belleğe alındı")
        except Exception as e:
            print(f"  [HATA] Görsel açılamadı: {e}")
            self._send_error(exam_paper_id, exam_id, f"Görsel açılamadı: {e}")
            return

        # 2. OCR — Öğrenci bilgisi + Kod okuma (paralel)
        # Her iki task aynı byte dizisini okur; bytes immutable olduğu için thread-safe
        print(f"  [2/4] OCR işlemi başlıyor...")
        student_info, extracted_code = await asyncio.gather(
            self.ocr.extract_student_info(image_bytes),
            self.ocr.extract_code(image_bytes, language)
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

    def _start_http_server(self):
        """
        Öğrenci Kod Test endpoint'i — ayrı thread'de Flask.
        Sınav değerlendirme kuyruğundan bağımsız çalışır, bu yüzden
        öğretmen batch değerlendirme yapıyorken bile öğrenci
        kendi kod testini anında başlatabilir.
        """
        port = int(os.getenv("PYTHON_WORKER_HTTP_PORT", "8765"))
        app = Flask(__name__)
        # Flask'ın WSGI thread pool'u (her istek kendi thread'inde),
        # her istek kendi asyncio loop'unu açar → paralellik.
        evaluator = self.evaluator

        @app.route("/health", methods=["GET"])
        def health():
            return jsonify({"status": "ok"})

        @app.route("/code-test", methods=["POST"])
        def code_test():
            try:
                data = request.get_json(force=True) or {}
                code = (data.get("code") or "").strip()
                language = data.get("language") or "unknown"
                teacher_context = data.get("teacherContext") or ""
                if not code:
                    return jsonify({"success": False, "message": "Kod boş olamaz."}), 400

                if not teacher_context:
                    teacher_context = (
                        f"The student is practicing {language} code on their own. "
                        "There is no specific rubric. Evaluate correctness, syntax, logic and good practices. "
                        "Score out of 100."
                    )

                print(f"\n [HTTP] /code-test geldi (Language: {language}, {len(code)} karakter)")
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    eval_result = loop.run_until_complete(
                        evaluator.evaluate(code, teacher_context, language)
                    )
                finally:
                    loop.close()

                ev = eval_result.get("evaluation", {})
                return jsonify({
                    "success": True,
                    "totalScore": ev.get("toplam_puan", 0),
                    "syntaxErrors": ev.get("syntax_hatalari", []),
                    "logicErrors": ev.get("mantik_hatalari", []),
                    "gelisimAlanlari": ev.get("gelisim_alanlari", []),
                    "hakemOzeti": ev.get("hakem_ozeti", ""),
                    "genelDegerlendirme": ev.get("genel_degerlendirme", ""),
                    "modelScores": eval_result.get("modelScores", {}),
                })
            except Exception as e:
                import traceback
                traceback.print_exc()
                return jsonify({"success": False, "message": f"Değerlendirme hatası: {e}"}), 500

        def _run():
            # use_reloader=False: ana thread'i bloklamadan çalış
            # threaded=True: eş zamanlı isteklere izin ver
            app.run(host="0.0.0.0", port=port, debug=False, use_reloader=False, threaded=True)

        t = threading.Thread(target=_run, daemon=True)
        t.start()
        print(f" [*] HTTP Kod Test endpoint aktif: http://localhost:{port}/code-test")

    def start(self):
        """Worker'ı başlat"""
        self.connect()
        self._start_http_server()
        self.channel.basic_consume(
            queue=LISTEN_QUEUE,
            on_message_callback=self._callback
        )
        print(f"\n {'='*60}")
        print(f"  CodexIQ AI Worker v3.0 (Free Tier)")
        print(f"  Jüri: Gemini 2.5 Flash + Groq Llama 3.3 + OpenRouter DeepSeek V3")
        print(f"  Hakem: Groq Llama 3.3 (JSON mode) + Gemini fallback")
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