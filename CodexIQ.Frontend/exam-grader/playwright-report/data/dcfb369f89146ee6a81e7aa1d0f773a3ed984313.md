# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 11-full-integration.spec.ts >> Aşama 4: Sınav Kağıdı Yükleme >> Teacher: yüklenen kağıdın 'Pending' durumunda olduğunu doğrula
- Location: e2e\11-full-integration.spec.ts:259:3

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Test source

```ts
  165 |     console.log(`[✓] Sınıf ID: ${classId}`);
  166 |   });
  167 | 
  168 |   test("Admin: ders oluştur", async ({ request }) => {
  169 |     expect(classId, "classId henüz set edilmedi").toBeTruthy();
  170 | 
  171 |     const res = await request.post(`${API_BASE}/admin/classes/courses`, {
  172 |       headers: auth(adminToken),
  173 |       data: { name: courseName, classId },
  174 |     });
  175 |     expect(res.ok(), "Ders oluşturulamadı").toBeTruthy();
  176 | 
  177 |     // courseId'yi bul
  178 |     const listRes  = await request.get(`${API_BASE}/admin/courses?classId=${classId}`, {
  179 |       headers: auth(adminToken),
  180 |     });
  181 |     const data    = await listRes.json();
  182 |     const courses = data.items || data.results || data.data || (Array.isArray(data) ? data : []);
  183 |     const found   = courses.find((c: any) => c.name === courseName);
  184 |     expect(found, "Oluşturulan ders listede bulunamadı").toBeTruthy();
  185 |     courseId = found.id;
  186 |     console.log(`[✓] Ders ID: ${courseId}`);
  187 |   });
  188 | });
  189 | 
  190 | // ══════════════════════════════════════════════════════════════════════════════
  191 | // AŞAMA 3 — Sınav Oluşturma
  192 | // ══════════════════════════════════════════════════════════════════════════════
  193 | test.describe("Aşama 3: Sınav Oluşturma", () => {
  194 | 
  195 |   test("Teacher: sınav oluştur", async ({ request }) => {
  196 |     expect(courseId, "courseId henüz set edilmedi").toBeTruthy();
  197 | 
  198 |     const res = await request.post(`${API_BASE}/teacher/exams`, {
  199 |       headers: auth(teacherToken),
  200 |       data: {
  201 |         name: examName,
  202 |         courseId,
  203 |         codePurpose: "print() fonksiyonu kullanarak 'Merhaba dünya' veya 'Merhaba dunya' metnini ekrana yazdırın.",
  204 |         programmingLanguage: "Python",
  205 |       },
  206 |     });
  207 |     expect(res.ok(), "Sınav oluşturulamadı").toBeTruthy();
  208 |     const data = await res.json();
  209 |     examId = data.data?.examId ?? data.examId ?? data.data?.id;
  210 |     expect(examId, "examId response'da bulunamadı").toBeTruthy();
  211 |     console.log(`[✓] Sınav oluşturuldu. ID: ${examId}`);
  212 |   });
  213 | 
  214 |   test("Teacher: rubrik ekle (50 + 50 puan)", async ({ request }) => {
  215 |     expect(examId).toBeTruthy();
  216 | 
  217 |     const res = await request.post(`${API_BASE}/teacher/exams/${examId}/rubric`, {
  218 |       headers: auth(teacherToken),
  219 |       data: {
  220 |         items: [
  221 |           { criteria: "print() fonksiyonu kullanımı",          maxPoints: 50 },
  222 |           { criteria: "Doğru string değeri ('Merhaba dünya')", maxPoints: 50 },
  223 |         ],
  224 |       },
  225 |     });
  226 |     expect(res.ok(), "Rubrik kaydedilemedi").toBeTruthy();
  227 |     console.log("[✓] Rubrik kaydedildi");
  228 |   });
  229 | });
  230 | 
  231 | // ══════════════════════════════════════════════════════════════════════════════
  232 | // AŞAMA 4 — Kağıt Yükleme
  233 | // ══════════════════════════════════════════════════════════════════════════════
  234 | test.describe("Aşama 4: Sınav Kağıdı Yükleme", () => {
  235 | 
  236 |   test("Teacher: test_image.jpg'yi sınava yükle", async ({ request }) => {
  237 |     expect(examId).toBeTruthy();
  238 | 
  239 |     const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
  240 | 
  241 |     const res = await request.post(`${API_BASE}/teacher/exams/${examId}/papers`, {
  242 |       headers: auth(teacherToken),
  243 |       multipart: {
  244 |         files: {
  245 |           name: "test_image.jpg",
  246 |           mimeType: "image/jpeg",
  247 |           buffer: imageBuffer,
  248 |         },
  249 |       },
  250 |     });
  251 |     expect(res.ok(), `Kağıt yüklenemedi: ${await res.text()}`).toBeTruthy();
  252 | 
  253 |     const data = await res.json();
  254 |     const uploaded = data.data?.uploadedCount ?? data.uploadedCount ?? data.data?.UploadedCount;
  255 |     expect(uploaded, "Yüklenen kağıt sayısı 0").toBeGreaterThan(0);
  256 |     console.log(`[✓] ${uploaded} kağıt yüklendi`);
  257 |   });
  258 | 
  259 |   test("Teacher: yüklenen kağıdın 'Pending' durumunda olduğunu doğrula", async ({ request }) => {
  260 |     // Sınavı al ve paper'ın durumunu kontrol et
  261 |     // (queue-status endpoint üzerinden kontrol ediyoruz)
  262 |     const res = await request.get(`${API_BASE}/teacher/queue-status`, {
  263 |       headers: auth(teacherToken),
  264 |     });
> 265 |     expect(res.ok()).toBeTruthy();
      |                      ^ Error: expect(received).toBeTruthy()
  266 |     const data = await res.json();
  267 |     const pending = data.data?.pending ?? data.pending ?? data.data?.Pending ?? 0;
  268 |     expect(pending, "Bekleyen kağıt yok — yükleme başarısız olmuş olabilir").toBeGreaterThan(0);
  269 |     console.log(`[✓] Kuyruk durumu: ${JSON.stringify(data.data ?? data)}`);
  270 |   });
  271 | });
  272 | 
  273 | // ══════════════════════════════════════════════════════════════════════════════
  274 | // AŞAMA 5 — Değerlendirmeyi Başlat
  275 | // ══════════════════════════════════════════════════════════════════════════════
  276 | test.describe("Aşama 5: Değerlendirmeyi Başlat", () => {
  277 | 
  278 |   test("Teacher: değerlendirmeyi kuyruğa al", async ({ request }) => {
  279 |     expect(examId).toBeTruthy();
  280 | 
  281 |     const res = await request.post(
  282 |       `${API_BASE}/teacher/exams/${examId}/start-evaluation`,
  283 |       { headers: auth(teacherToken) }
  284 |     );
  285 |     expect(res.ok(), `Değerlendirme başlatılamadı: ${await res.text()}`).toBeTruthy();
  286 |     const data = await res.json();
  287 |     console.log(`[✓] Değerlendirme başlatıldı: ${JSON.stringify(data.data ?? data)}`);
  288 |   });
  289 | });
  290 | 
  291 | // ══════════════════════════════════════════════════════════════════════════════
  292 | // AŞAMA 6 — Python Worker Sonucunu Bekle (Polling)
  293 | // ══════════════════════════════════════════════════════════════════════════════
  294 | test.describe("Aşama 6: AI Değerlendirme Sonucunu Bekle", () => {
  295 | 
  296 |   test(
  297 |     `Python worker sonucu bekle (max ${EVAL_TIMEOUT_SEC} sn)`,
  298 |     async ({ request }) => {
  299 |       // Bu test uzun sürebilir — Playwright default timeout'u override ediyoruz
  300 |       test.setTimeout((EVAL_TIMEOUT_SEC + 15) * 1000);
  301 | 
  302 |       expect(adminToken).toBeTruthy();
  303 |       expect(teacherToken).toBeTruthy();
  304 | 
  305 |       console.log(`\n⏳ Python worker sonucu bekleniyor (max ${EVAL_TIMEOUT_SEC} sn)...`);
  306 |       console.log("   Not: Python worker çalışmıyorsa bu test timeout olur.\n");
  307 | 
  308 |       const deadline = Date.now() + EVAL_TIMEOUT_SEC * 1000;
  309 |       let found      = false;
  310 | 
  311 |       while (Date.now() < deadline) {
  312 |         // Teacher results listesini sorgula
  313 |         const res = await request.get(
  314 |           `${API_BASE}/teacher/results?pageSize=20`,
  315 |           { headers: auth(teacherToken) }
  316 |         );
  317 | 
  318 |         if (res.ok()) {
  319 |           const data    = await res.json();
  320 |           const results = data.data?.items ?? data.items ?? data.data ?? [];
  321 | 
  322 |           if (Array.isArray(results) && results.length > 0) {
  323 |             // Bu sınava ait sonucu bul
  324 |             const match = results.find((r: any) =>
  325 |               r.examName === examName || r.ExamName === examName
  326 |             );
  327 | 
  328 |             if (match) {
  329 |               resultId = match.id ?? match.Id;
  330 |               const score = match.score ?? match.Score ?? match.totalScore;
  331 |               console.log(`\n[✓] Sonuç geldi!`);
  332 |               console.log(`    ExamPaper ID : ${resultId}`);
  333 |               console.log(`    Puan         : ${score}/100`);
  334 |               console.log(`    Öğrenci Adı  : ${match.studentName ?? match.StudentName}`);
  335 |               found = true;
  336 |               break;
  337 |             }
  338 |           }
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
```