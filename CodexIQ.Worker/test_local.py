"""
CodexIQ Local Test Script
==========================
RabbitMQ olmadan OCR + Ensemble'ı test etmek için.
Kullanım: python test_local.py <görsel_yolu>
"""

import asyncio
import json
import sys
import os

from PIL import Image, ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True

# Worker modülünden import
from worker import OCRReader, EnsembleEvaluator

async def test_single_image(image_path: str):
    """Tek bir görseli test et"""
    from PIL import Image

    if not os.path.exists(image_path):
        print(f"HATA: {image_path} bulunamadı!")
        return

    print(f"\n{'='*60}")
    print(f"  TEST BAŞLADI: {image_path}")
    print(f"{'='*60}\n")

    image = Image.open(image_path)
    ocr = OCRReader()
    evaluator = EnsembleEvaluator()

    # 1. OCR
    print("ADIM 1: OCR İşlemi")
    print("-" * 40)
    student_info, extracted_code = await asyncio.gather(
        ocr.extract_student_info(image),
        ocr.extract_code(image)
    )

    print(f"\nÖğrenci Bilgisi: {json.dumps(student_info, ensure_ascii=False, indent=2)}")
    print(f"\nOkunan Kod:\n{'-'*40}\n{extracted_code}\n{'-'*40}")

    if not extracted_code:
        print("HATA: Kod okunamadı!")
        return

    # 2. Değerlendirme
    print("\nADIM 2: Ensemble Değerlendirme")
    print("-" * 40)

    teacher_context = """
    Evaluate the code written by the student.
    Check for correctness, syntax errors, and logic errors.
    Score out of 100.
    
    ## OCR Tolerance
    * Do not penalize for missing indentation if logical blocks are clear.
    * Forgive minor handwriting artifacts.
    """

    result = await evaluator.evaluate(extracted_code, teacher_context, "python")

    # 3. Sonuç
    print(f"\n{'='*60}")
    print("  SONUÇ")
    print(f"{'='*60}\n")

    evaluation = result["evaluation"]
    print(f"Toplam Puan: {evaluation.get('toplam_puan', 0)}/100")
    print(f"\nModel Skorları: {json.dumps(result['modelScores'], indent=2)}")

    print(f"\nSyntax Hataları ({len(evaluation.get('syntax_hatalari', []))}):")
    for err in evaluation.get("syntax_hatalari", []):
        print(f"  - Satır {err.get('satir')}: {err.get('aciklama')} [{err.get('severity')}]")
        print(f"    İpucu: {err.get('hint')}")

    print(f"\nMantık Hataları ({len(evaluation.get('mantik_hatalari', []))}):")
    for err in evaluation.get("mantik_hatalari", []):
        print(f"  - Satır {err.get('satir')}: {err.get('aciklama')} [{err.get('severity')}]")
        print(f"    İpucu: {err.get('hint')}")

    print(f"\nGelişim Alanları ({len(evaluation.get('gelisim_alanlari', []))}):")
    for area in evaluation.get("gelisim_alanlari", []):
        print(f"  - {area.get('konu')} (Seviye: %{area.get('mevcut_seviye', 0)})")
        print(f"    Öneri: {area.get('oneri')}")

    print(f"\nGenel Değerlendirme: {evaluation.get('genel_degerlendirme', '')}")
    print(f"\nHakem Özeti: {evaluation.get('hakem_ozeti', '')}")

    # JSON dosyasına kaydet
    output_file = "test_result.json"
    full_result = {
        "studentInfo": student_info,
        "extractedCode": extracted_code,
        "evaluation": evaluation,
        "modelScores": result["modelScores"]
    }

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(full_result, f, indent=4, ensure_ascii=False)

    print(f"\nSonuç kaydedildi: {output_file}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Kullanım: python test_local.py <görsel_yolu>")
        print("Örnek: python test_local.py test_image.jpg")
        sys.exit(1)

    asyncio.run(test_single_image(sys.argv[1]))