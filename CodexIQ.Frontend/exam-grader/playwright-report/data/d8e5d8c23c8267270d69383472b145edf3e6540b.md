# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 11-full-integration.spec.ts >> Aşama 9: Öğrenci (METE YILMAZ) Kendi Sonucunu Görüyor >> METE YILMAZ: orijinal kağıt görselini indir
- Location: e2e\11-full-integration.spec.ts:509:3

# Error details

```
Error: expect(received).toBeTruthy()

Received: undefined
```

# Test source

```ts
  410 |     // OCR isim eşleştirmesi başarılıysa "METE YILMAZ" görünür
  411 |     // Başarısız olursa "OCR BEKLENİYOR" görünür (test soft-check yapıyor)
  412 |     if (studentName.includes("METE") && studentName.includes("YILMAZ")) {
  413 |       console.log("[✓] OCR öğrenci eşleştirmesi BAŞARILI — METE YILMAZ bulundu!");
  414 |     } else {
  415 |       console.warn(`[⚠] OCR öğrenci eşleştirmesi BAŞARISIZ — ad: "${studentName}"`);
  416 |       console.warn("    Bu normal olabilir. Consumer isim bazlı eşleştiriyor.");
  417 |     }
  418 |     // Hard fail değil — isim eşleşmeyebilir ama diğer veriler gelmiş olabilir
  419 |     expect(true).toBeTruthy();
  420 |   });
  421 | });
  422 | 
  423 | // ══════════════════════════════════════════════════════════════════════════════
  424 | // AŞAMA 8 — Sonucu Öğrenciyle Paylaş
  425 | // ══════════════════════════════════════════════════════════════════════════════
  426 | test.describe("Aşama 8: Sonucu Öğrenciyle Paylaş", () => {
  427 | 
  428 |   test("Teacher: IsShared = true yap", async ({ request }) => {
  429 |     expect(resultId).toBeTruthy();
  430 | 
  431 |     const res = await request.put(`${API_BASE}/teacher/results/${resultId}/share`, {
  432 |       headers: auth(teacherToken),
  433 |     });
  434 |     expect(res.ok(), "Paylaşma başarısız").toBeTruthy();
  435 |     console.log("[✓] Sonuç paylaşıldı");
  436 |   });
  437 | 
  438 |   test("Teacher: not ekle", async ({ request }) => {
  439 |     expect(resultId).toBeTruthy();
  440 | 
  441 |     const res = await request.put(`${API_BASE}/teacher/results/${resultId}/note`, {
  442 |       headers: auth(teacherToken),
  443 |       data: { note: "print() kullanımın doğru. 'Merhaba dünya' yazımına dikkat et." },
  444 |     });
  445 |     expect(res.ok(), "Not eklenemedi").toBeTruthy();
  446 |     console.log("[✓] Öğretmen notu eklendi");
  447 |   });
  448 | });
  449 | 
  450 | // ══════════════════════════════════════════════════════════════════════════════
  451 | // AŞAMA 9 — Öğrenci Kendi Sonucunu Görüyor
  452 | // ══════════════════════════════════════════════════════════════════════════════
  453 | test.describe("Aşama 9: Öğrenci (METE YILMAZ) Kendi Sonucunu Görüyor", () => {
  454 | 
  455 |   test("METE YILMAZ: sonuçlar listesinde sınav görünüyor mu?", async ({ request }) => {
  456 |     expect(meteToken).toBeTruthy();
  457 | 
  458 |     const res = await request.get(`${API_BASE}/student/results?pageSize=20`, {
  459 |       headers: auth(meteToken),
  460 |     });
  461 |     expect(res.ok(), "Öğrenci sonuçları alınamadı").toBeTruthy();
  462 | 
  463 |     const data    = await res.json();
  464 |     const results = data.data?.items ?? data.items ?? data.data ?? [];
  465 | 
  466 |     // OCR eşleştirmesi başarılıysa bu sınav listede görünür
  467 |     if (Array.isArray(results) && results.length > 0) {
  468 |       console.log(`[✓] Öğrenci ${results.length} sonuç görüyor`);
  469 |       results.forEach((r: any) => {
  470 |         console.log(`    - ${r.examName ?? r.ExamName}: ${r.score ?? r.Score}/100`);
  471 |       });
  472 |     } else {
  473 |       console.warn("[⚠] Öğrenci henüz hiç sonuç göremiyorr");
  474 |       console.warn("    OCR isim eşleştirmesi başarısız olmuş olabilir");
  475 |     }
  476 |     // Sonuç 0 olsa bile fail etmiyoruz — OCR eşleştirme soft-check
  477 |     expect(res.ok()).toBeTruthy();
  478 |   });
  479 | 
  480 |   test("METE YILMAZ: sonuç detayını gör (examPaperId ile doğrudan)", async ({ request }) => {
  481 |     expect(meteToken).toBeTruthy();
  482 |     expect(examPaperId).toBeTruthy();
  483 | 
  484 |     const res = await request.get(`${API_BASE}/student/results/${examPaperId}`, {
  485 |       headers: auth(meteToken),
  486 |     });
  487 | 
  488 |     // 404 gelebilir (StudentId eşleşmedi ise)
  489 |     if (res.status() === 404) {
  490 |       console.warn("[⚠] Öğrenci bu sonuca erişemiyor (StudentId eşleşmedi)");
  491 |       console.warn("    firstName='METE', lastName='YILMAZ' tam olarak eşleşiyor mu?");
  492 |       return;
  493 |     }
  494 | 
  495 |     expect(res.ok(), "Öğrenci sonuç detayı alınamadı").toBeTruthy();
  496 |     const data   = await res.json();
  497 |     const detail = data.data ?? data;
  498 | 
  499 |     console.log(`\n🎓 ÖĞRENCİ BAKIŞ AÇISI:`);
  500 |     console.log(`   Sınav  : ${detail.examName ?? detail.ExamName}`);
  501 |     console.log(`   Puan   : ${detail.totalScore ?? detail.TotalScore ?? detail.score}/100`);
  502 |     console.log(`   Kod    : ${(detail.code ?? detail.Code ?? "").substring(0, 60)}`);
  503 |     console.log(`   Not    : ${detail.teacherNote ?? detail.TeacherNote ?? "(yok)"}`);
  504 | 
  505 |     const score = detail.totalScore ?? detail.TotalScore ?? detail.score ?? 0;
  506 |     expect(score).toBeGreaterThan(0);
  507 |   });
  508 | 
  509 |   test("METE YILMAZ: orijinal kağıt görselini indir", async ({ request }) => {
> 510 |     expect(meteToken).toBeTruthy();
      |                       ^ Error: expect(received).toBeTruthy()
  511 |     expect(examPaperId).toBeTruthy();
  512 | 
  513 |     const res = await request.get(
  514 |       `${API_BASE}/student/results/${examPaperId}/paper-image`,
  515 |       { headers: auth(meteToken) }
  516 |     );
  517 | 
  518 |     if (res.status() === 404) {
  519 |       console.warn("[⚠] Kağıt görseli bulunamadı — paylaşılmadı veya StudentId eşleşmedi");
  520 |       return;
  521 |     }
  522 | 
  523 |     expect(res.ok(), "Kağıt görseli alınamadı").toBeTruthy();
  524 |     const contentType = res.headers()["content-type"] ?? "";
  525 |     expect(contentType.includes("image"), "Content-Type image olmalı").toBeTruthy();
  526 | 
  527 |     const buffer = await res.body();
  528 |     expect(buffer.length, "Görsel boş").toBeGreaterThan(1000);
  529 |     console.log(`[✓] Kağıt görseli alındı: ${buffer.length} byte, Content-Type: ${contentType}`);
  530 |   });
  531 | });
  532 | 
  533 | // ══════════════════════════════════════════════════════════════════════════════
  534 | // AŞAMA 10 — Temizlik
  535 | // ══════════════════════════════════════════════════════════════════════════════
  536 | test.describe("Aşama 10: Temizlik", () => {
  537 | 
  538 |   test("Admin: test sınavını sil (exam → course → class sırasıyla)", async ({ request }) => {
  539 |     // Course sil
  540 |     if (courseId) {
  541 |       const r = await request.delete(`${API_BASE}/admin/courses/${courseId}`, {
  542 |         headers: auth(adminToken),
  543 |       });
  544 |       console.log(`[Temizlik] Course silindi (${r.status()})`);
  545 |     }
  546 | 
  547 |     // Class sil
  548 |     if (classId) {
  549 |       const r = await request.delete(`${API_BASE}/admin/classes/${classId}`, {
  550 |         headers: auth(adminToken),
  551 |       });
  552 |       console.log(`[Temizlik] Class silindi (${r.status()})`);
  553 |     }
  554 | 
  555 |     // METE YILMAZ'ı silmiyoruz — kullanıcı manuel oluşturuldu, manuel silinsin
  556 |     console.log("[ℹ] METE YILMAZ kullanıcısı test tarafından silinmiyor (SQL ile oluşturuldu)");
  557 | 
  558 |     expect(true).toBeTruthy();
  559 |   });
  560 | });
  561 | 
```