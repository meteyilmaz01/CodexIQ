"""
CodexIQ Insight Worker
======================
RabbitMQ'dan generate-insight-queue'yu dinler,
öğrencinin hata geçmişini Groq ile analiz edip
kişiselleştirilmiş gelişim önerisi üretir,
sonucu insight-result-queue'ya gönderir.
"""

import json
import os
import time
import pika
from openai import OpenAI

# ============================================================
# KONFIGÜRASYON
# ============================================================

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "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")

RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "localhost")
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "guest")
RABBITMQ_PASS = os.getenv("RABBITMQ_PASS", "guest")

LISTEN_QUEUE  = "generate-insight-queue"
RESULT_QUEUE  = "insight-result-queue"

groq_client = OpenAI(
    api_key=GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1"
)

# ============================================================
# PROMPT OLUŞTURMA
# ============================================================

def build_full_reset_prompt(all_errors: list) -> str:
    lines = []
    for entry in all_errors:
        idx = entry.get("examIndex", "?")
        syntax = entry.get("syntaxErrors", [])
        logic  = entry.get("logicErrors", [])
        if syntax or logic:
            lines.append(f"Sınav {idx}:")
            for e in syntax:
                lines.append(f"  [Syntax] {e}")
            for e in logic:
                lines.append(f"  [Mantık] {e}")

    if not lines:
        return ""

    errors_text = "\n".join(lines)
    return f"""Aşağıda bir programlama öğrencisinin birden fazla sınavdaki hata kayıtları bulunuyor.
Bu hataları analiz et, ortak örüntüleri ve tekrar eden zayıflıkları bul.

{errors_text}

Öğrenciye yönelik, 3 maddelik kısa ve yapıcı bir Türkçe gelişim önerisi yaz.
Her madde maksimum 2 cümle olsun. Teknik jargon kullanma, doğrudan öğrenciye hitap et.
Sadece maddeleri yaz, başlık veya açıklama ekleme."""


def build_delta_prompt(current_insight: str, new_syntax: list, new_logic: list, total_count: int) -> str:
    new_errors = []
    for e in new_syntax:
        new_errors.append(f"  [Syntax] {e}")
    for e in new_logic:
        new_errors.append(f"  [Mantık] {e}")

    if not new_errors:
        return ""

    new_errors_text = "\n".join(new_errors)
    return f"""Bir programlama öğrencisinin mevcut gelişim özeti aşağıdadır (toplam {total_count - 1} sınav üzerinden):

{current_insight}

Öğrenci yeni bir sınav daha verdi ({total_count}. sınav). Yeni hatalar:
{new_errors_text}

Bu yeni bilgilerle gelişim özetini güncelle.
- Eski sorunlar hala devam ediyorsa vurgula
- Yeni sorun ortaya çıktıysa ekle
- Çözülen sorun varsa çıkar

3 maddelik kısa Türkçe, öğrenciye hitap eden format. Sadece maddeleri yaz."""


# ============================================================
# GROQ ÇAĞRISI
# ============================================================

def generate_insight(prompt: str) -> str:
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "Sen bir programlama eğitmenisin. Öğrencilere kısa, yapıcı ve anlaşılır geri bildirim veriyorsun."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        max_tokens=400,
        temperature=0.5
    )
    return response.choices[0].message.content.strip()


# ============================================================
# MESAJ İŞLEME
# ============================================================

def process_message(body: bytes, channel, method):
    try:
        data = json.loads(body)
        student_id       = data.get("studentId")
        is_full_reset    = data.get("isFullReset", True)
        total_count      = data.get("totalExamCount", 0)
        current_insight  = data.get("currentInsightText", "")
        exam_count_last  = data.get("examCountAtLastInsight", 0)

        print(f"\n[INSIGHT] ═══════════════════════════════════")
        print(f"[INSIGHT] StudentId : {student_id}")
        print(f"[INSIGHT] FullReset : {is_full_reset}")
        print(f"[INSIGHT] ToplamSınav: {total_count}")
        print(f"[INSIGHT] ═══════════════════════════════════")

        if is_full_reset:
            all_errors = data.get("allErrors", [])
            prompt = build_full_reset_prompt(all_errors)
        else:
            new_syntax = data.get("newExamSyntaxErrors", [])
            new_logic  = data.get("newExamLogicErrors", [])
            # Delta için mevcut insight yoksa full reset yap
            if not current_insight:
                all_errors = [{"examIndex": 1, "syntaxErrors": new_syntax, "logicErrors": new_logic}]
                prompt = build_full_reset_prompt(all_errors)
            else:
                prompt = build_delta_prompt(current_insight, new_syntax, new_logic, total_count)

        if not prompt:
            print(f"[INSIGHT][UYARI] Hata verisi yok, insight üretilmedi.")
            publish_result(channel, student_id, "", total_count, success=False)
            channel.basic_ack(delivery_tag=method.delivery_tag)
            return

        insight_text = generate_insight(prompt)
        print(f"[INSIGHT][✅] Üretildi ({len(insight_text)} karakter)")

        publish_result(channel, student_id, insight_text, total_count, success=True)
        channel.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as ex:
        print(f"[INSIGHT][HATA] {ex}")
        try:
            student_id = json.loads(body).get("studentId", "")
            total_count = json.loads(body).get("totalExamCount", 0)
            publish_result(channel, student_id, "", total_count, success=False)
        except:
            pass
        channel.basic_ack(delivery_tag=method.delivery_tag)


def publish_result(channel, student_id, insight_text: str, exam_count: int, success: bool):
    result = {
        "studentId": student_id,
        "insightText": insight_text,
        "examCountAtInsight": exam_count,
        "success": success
    }
    channel.basic_publish(
        exchange="",
        routing_key=RESULT_QUEUE,
        body=json.dumps(result),
        properties=pika.BasicProperties(content_type="application/json", delivery_mode=2)
    )
    print(f"[INSIGHT] Sonuç gönderildi → {RESULT_QUEUE}")


# ============================================================
# RABBITMQ BAĞLANTISI VE DÖNGÜ
# ============================================================

def connect_rabbitmq():
    while True:
        try:
            credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
            params = pika.ConnectionParameters(
                host=RABBITMQ_HOST,
                credentials=credentials,
                heartbeat=600,
                blocked_connection_timeout=300
            )
            connection = pika.BlockingConnection(params)
            channel = connection.channel()

            channel.queue_declare(queue=LISTEN_QUEUE, durable=True)
            channel.queue_declare(queue=RESULT_QUEUE, durable=True)
            channel.basic_qos(prefetch_count=1)

            print(f"[INSIGHT] RabbitMQ bağlandı. '{LISTEN_QUEUE}' dinleniyor...")

            channel.basic_consume(
                queue=LISTEN_QUEUE,
                on_message_callback=lambda ch, method, props, body: process_message(body, ch, method)
            )
            channel.start_consuming()

        except pika.exceptions.AMQPConnectionError as e:
            print(f"[INSIGHT] Bağlantı hatası: {e}. 5 saniye sonra yeniden deneniyor...")
            time.sleep(5)
        except KeyboardInterrupt:
            print("[INSIGHT] Durduruluyor...")
            break


if __name__ == "__main__":
    connect_rabbitmq()
