# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 11-full-integration.spec.ts >> Aşama 8: Sonucu Öğrenciyle Paylaş >> Teacher: not ekle
- Location: e2e\11-full-integration.spec.ts:438:3

# Error details

```
Error: expect(received).toBeTruthy()

Received: undefined
```

# Test source

```ts
  339 |         }
  340 | 
  341 |         console.log(`   ... ${Math.round((deadline - Date.now()) / 1000)} sn kaldı`);
  342 |         await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  343 |       }
  344 | 
  345 |       expect(found, `${EVAL_TIMEOUT_SEC} saniye içinde sonuç gelmedi — Python worker çalışıyor mu?`).toBeTruthy();
  346 |     }
  347 |   );
  348 | });
  349 | 
  350 | // ══════════════════════════════════════════════════════════════════════════════
  351 | // AŞAMA 7 — Sonuç Detaylarını Doğrula
  352 | // ══════════════════════════════════════════════════════════════════════════════
  353 | test.describe("Aşama 7: Sonuç Doğrulama", () => {
  354 | 
  355 |   test("Teacher: sonuç detayını gör — kod, hatalar, model skorları", async ({ request }) => {
  356 |     expect(resultId, "resultId henüz set edilmedi — önceki aşama başarısız").toBeTruthy();
  357 | 
  358 |     const res = await request.get(`${API_BASE}/teacher/results/${resultId}`, {
  359 |       headers: auth(teacherToken),
  360 |     });
  361 |     expect(res.ok(), "Sonuç detayı alınamadı").toBeTruthy();
  362 | 
  363 |     const data   = await res.json();
  364 |     const detail = data.data ?? data;
  365 | 
  366 |     console.log(`\n📊 SONUÇ DETAYI:`);
  367 |     console.log(`   Öğrenci   : ${detail.studentName ?? detail.StudentName}`);
  368 |     console.log(`   Puan      : ${detail.totalScore ?? detail.TotalScore ?? detail.score}/100`);
  369 |     console.log(`   Kod       : ${(detail.code ?? detail.Code ?? "").substring(0, 80)}...`);
  370 |     console.log(`   Syntax H. : ${detail.syntaxErrorCount ?? detail.SyntaxErrorCount ?? 0}`);
  371 |     console.log(`   Mantık H. : ${detail.logicErrorCount ?? detail.LogicErrorCount ?? 0}`);
  372 | 
  373 |     // OCR kodu okumuş olmalı
  374 |     const code = detail.code ?? detail.Code ?? "";
  375 |     expect(
  376 |       code.toLowerCase().includes("print"),
  377 |       `OCR 'print' fonksiyonunu okuyamamış. Okunan kod: "${code}"`
  378 |     ).toBeTruthy();
  379 | 
  380 |     // Puan 0'dan büyük olmalı (Worker çalışmış demektir)
  381 |     const score = detail.totalScore ?? detail.TotalScore ?? detail.score ?? 0;
  382 |     expect(score, "Puan 0 — değerlendirme başarısız").toBeGreaterThan(0);
  383 | 
  384 |     // Model skorları var mı?
  385 |     const modelScores = detail.modelScores ?? detail.ModelScores ?? [];
  386 |     expect(Array.isArray(modelScores), "Model skorları dizi olmalı").toBeTruthy();
  387 |     console.log(`   Model Skor Sayısı: ${modelScores.length}`);
  388 |     if (modelScores.length > 0) {
  389 |       modelScores.forEach((m: any) => {
  390 |         console.log(`     - ${m.modelName ?? m.ModelName}: ${m.score ?? m.Score}/100`);
  391 |       });
  392 |     }
  393 | 
  394 |     // ExamPaper paperId'yi al (öğrenci görüntüleme için)
  395 |     examPaperId = resultId;
  396 |   });
  397 | 
  398 |   test("Teacher: öğrenci adı 'METE YILMAZ' olarak eşleşmiş mi?", async ({ request }) => {
  399 |     expect(resultId).toBeTruthy();
  400 | 
  401 |     const res    = await request.get(`${API_BASE}/teacher/results/${resultId}`, {
  402 |       headers: auth(teacherToken),
  403 |     });
  404 |     const data   = await res.json();
  405 |     const detail = data.data ?? data;
  406 | 
  407 |     const studentName = (detail.studentName ?? detail.StudentName ?? "").toUpperCase();
  408 |     console.log(`[ℹ] Öğrenci adı: "${studentName}"`);
  409 | 
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
> 439 |     expect(resultId).toBeTruthy();
      |                      ^ Error: expect(received).toBeTruthy()
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
  510 |     expect(meteToken).toBeTruthy();
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
```