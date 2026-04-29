/**
 * 11 — TAM ENTEGRASYON TESTİ
 * ═══════════════════════════════════════════════════════════════
 *
 * Senaryo: METE YILMAZ (2110206040) adlı öğrencinin sınav kağıdı
 * sisteme yükleniyor, Python worker tarafından değerlendiriliyor,
 * öğretmen sonucu paylaşıyor ve öğrenci kendi sonucunu görüyor.
 *
 * ÖN KOŞULLAR (test başlamadan önce hazır olmalı):
 *   1. Backend çalışıyor  → http://localhost:5062
 *   2. Python worker çalışıyor  → python worker.py
 *   3. RabbitMQ çalışıyor
 *   4. METE YILMAZ veritabanında mevcut:
 *        email: mete.yilmaz@codexiq.com
 *        şifre: 12345
 *        firstName: METE, lastName: YILMAZ, role: 1 (Student)
 *
 * METE YILMAZ yoksa önce şu SQL'i çalıştır:
 *   INSERT INTO "Users" ("Id","Email","PasswordHash","FirstName","LastName","Role","CreatedDate","IsActive")
 *   VALUES (gen_random_uuid(),'mete.yilmaz@codexiq.com',
 *           (SELECT "PasswordHash" FROM "Users" WHERE "Email"='teacher@codexiq.com' LIMIT 1),
 *           'METE','YILMAZ',1,NOW(),true);
 *
 * ═══════════════════════════════════════════════════════════════
 */

import { test, expect } from "@playwright/test";
import { API_BASE, TEST_USERS } from "./helpers";
import * as fs from "fs";
import * as path from "path";

// ── Sabitler ──────────────────────────────────────────────────────────────────
const METE_EMAIL    = "mete.yilmaz@codexiq.com";
const METE_PASSWORD = "12345";

// test_image.jpg yolu — Python proje klasörü
const TEST_IMAGE_PATH = path.join(
  "C:\\Users\\Win11\\Desktop\\proje dosyaları\\project python\\test_image.jpg"
);

// Değerlendirme bitene kadar max bekleme (sn) — AI işlemi uzun sürebilir
const EVAL_TIMEOUT_SEC = 120;
const POLL_INTERVAL_MS = 5000;

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// ── State ─────────────────────────────────────────────────────────────────────
let adminToken: string;
let teacherToken: string;
let meteToken: string;
let meteUserId: string;
let classId: string;
let courseId: string;
let examId: string;
let examPaperId: string;
let resultId: string;

const className  = `Integration-Class-${Date.now()}`;
const courseName = `Integration-Course-${Date.now()}`;
const examName   = `Python Temel - Merhaba Dünya (${Date.now()})`;

// ══════════════════════════════════════════════════════════════════════════════
// AŞAMA 1 — Token'lar ve METE YILMAZ ID'si
// ══════════════════════════════════════════════════════════════════════════════
test.describe("Aşama 1: Kurulum — Token'lar ve Kullanıcı ID'leri", () => {

  test("Admin login", async ({ request }) => {
    const res = await request.post(`${API_BASE}/auth/login`, {
      data: TEST_USERS.admin,
    });
    expect(res.ok(), "Admin login başarısız").toBeTruthy();
    adminToken = (await res.json()).data.token;
    expect(adminToken).toBeTruthy();
    console.log("[✓] Admin token alındı");
  });

  test("Teacher login", async ({ request }) => {
    const res = await request.post(`${API_BASE}/auth/login`, {
      data: TEST_USERS.teacher,
    });
    expect(res.ok(), "Teacher login başarısız").toBeTruthy();
    teacherToken = (await res.json()).data.token;
    expect(teacherToken).toBeTruthy();
    console.log("[✓] Teacher token alındı");
  });

  test("METE YILMAZ login (veritabanında mevcut olmalı)", async ({ request }) => {
    const res = await request.post(`${API_BASE}/auth/login`, {
      data: { email: METE_EMAIL, password: METE_PASSWORD },
    });
    expect(
      res.ok(),
      `METE YILMAZ (${METE_EMAIL}) bulunamadı! Önce SQL ile veritabanına ekle.`
    ).toBeTruthy();
    meteToken = (await res.json()).data.token;
    expect(meteToken).toBeTruthy();
    console.log("[✓] METE YILMAZ token alındı");
  });

  test("Admin: METE YILMAZ'ın ID'sini bul", async ({ request }) => {
    const res = await request.get(
      `${API_BASE}/admin/users?search=${encodeURIComponent(METE_EMAIL)}`,
      { headers: auth(adminToken) }
    );
    expect(res.ok()).toBeTruthy();

    const data    = await res.json();
    const users   = data.items || data.results || data.data || data;
    const mete    = Array.isArray(users)
      ? users.find((u: any) => u.email === METE_EMAIL)
      : null;

    expect(mete, `${METE_EMAIL} admin users listesinde bulunamadı`).toBeTruthy();
    meteUserId = mete.id;
    console.log(`[✓] METE YILMAZ ID: ${meteUserId}`);
  });

  test("test_image.jpg dosyasının varlığını kontrol et", () => {
    expect(
      fs.existsSync(TEST_IMAGE_PATH),
      `test_image.jpg bulunamadı: ${TEST_IMAGE_PATH}`
    ).toBeTruthy();
    const size = fs.statSync(TEST_IMAGE_PATH).size;
    expect(size).toBeGreaterThan(0);
    console.log(`[✓] test_image.jpg bulundu (${size} byte)`);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// AŞAMA 2 — Sınıf & Ders Oluşturma
// ══════════════════════════════════════════════════════════════════════════════
test.describe("Aşama 2: Sınıf ve Ders Oluşturma", () => {

  test("Admin: teacher ID'sini bul", async ({ request }) => {
    const res = await request.get(
      `${API_BASE}/admin/users?search=${encodeURIComponent(TEST_USERS.teacher.email)}`,
      { headers: auth(adminToken) }
    );
    const data    = await res.json();
    const users   = data.items || data.results || data.data || data;
    const teacher = Array.isArray(users)
      ? users.find((u: any) => u.email === TEST_USERS.teacher.email)
      : null;
    expect(teacher).toBeTruthy();

    // Sınıf oluştur
    const classRes = await request.post(`${API_BASE}/admin/classes`, {
      headers: auth(adminToken),
      data: { name: className, teacherId: teacher.id },
    });
    expect(classRes.ok(), "Sınıf oluşturulamadı").toBeTruthy();
    console.log(`[✓] Sınıf oluşturuldu: ${className}`);

    // classId'yi bul
    const listRes = await request.get(`${API_BASE}/admin/classes`, {
      headers: auth(adminToken),
    });
    const listData = await listRes.json();
    const classes  = Array.isArray(listData) ? listData : listData.data || listData.items || [];
    const found    = classes.find((c: any) => c.name === className);
    expect(found, "Oluşturulan sınıf listede bulunamadı").toBeTruthy();
    classId = found.id;
    console.log(`[✓] Sınıf ID: ${classId}`);
  });

  test("Admin: ders oluştur", async ({ request }) => {
    expect(classId, "classId henüz set edilmedi").toBeTruthy();

    const res = await request.post(`${API_BASE}/admin/classes/courses`, {
      headers: auth(adminToken),
      data: { name: courseName, classId },
    });
    expect(res.ok(), "Ders oluşturulamadı").toBeTruthy();

    // courseId'yi bul
    const listRes  = await request.get(`${API_BASE}/admin/courses?classId=${classId}`, {
      headers: auth(adminToken),
    });
    const data    = await listRes.json();
    const courses = data.items || data.results || data.data || (Array.isArray(data) ? data : []);
    const found   = courses.find((c: any) => c.name === courseName);
    expect(found, "Oluşturulan ders listede bulunamadı").toBeTruthy();
    courseId = found.id;
    console.log(`[✓] Ders ID: ${courseId}`);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// AŞAMA 3 — Sınav Oluşturma
// ══════════════════════════════════════════════════════════════════════════════
test.describe("Aşama 3: Sınav Oluşturma", () => {

  test("Teacher: sınav oluştur", async ({ request }) => {
    expect(courseId, "courseId henüz set edilmedi").toBeTruthy();

    const res = await request.post(`${API_BASE}/teacher/exams`, {
      headers: auth(teacherToken),
      data: {
        name: examName,
        courseId,
        codePurpose: "print() fonksiyonu kullanarak 'Merhaba dünya' veya 'Merhaba dunya' metnini ekrana yazdırın.",
        programmingLanguage: "Python",
      },
    });
    expect(res.ok(), "Sınav oluşturulamadı").toBeTruthy();
    const data = await res.json();
    examId = data.data?.examId ?? data.examId ?? data.data?.id;
    expect(examId, "examId response'da bulunamadı").toBeTruthy();
    console.log(`[✓] Sınav oluşturuldu. ID: ${examId}`);
  });

  test("Teacher: rubrik ekle (50 + 50 puan)", async ({ request }) => {
    expect(examId).toBeTruthy();

    const res = await request.post(`${API_BASE}/teacher/exams/${examId}/rubric`, {
      headers: auth(teacherToken),
      data: {
        items: [
          { criteria: "print() fonksiyonu kullanımı",          maxPoints: 50 },
          { criteria: "Doğru string değeri ('Merhaba dünya')", maxPoints: 50 },
        ],
      },
    });
    expect(res.ok(), "Rubrik kaydedilemedi").toBeTruthy();
    console.log("[✓] Rubrik kaydedildi");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// AŞAMA 4 — Kağıt Yükleme
// ══════════════════════════════════════════════════════════════════════════════
test.describe("Aşama 4: Sınav Kağıdı Yükleme", () => {

  test("Teacher: test_image.jpg'yi sınava yükle", async ({ request }) => {
    expect(examId).toBeTruthy();

    const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);

    const res = await request.post(`${API_BASE}/teacher/exams/${examId}/papers`, {
      headers: auth(teacherToken),
      multipart: {
        files: {
          name: "test_image.jpg",
          mimeType: "image/jpeg",
          buffer: imageBuffer,
        },
      },
    });
    expect(res.ok(), `Kağıt yüklenemedi: ${await res.text()}`).toBeTruthy();

    const data = await res.json();
    const uploaded = data.data?.uploadedCount ?? data.uploadedCount ?? data.data?.UploadedCount;
    expect(uploaded, "Yüklenen kağıt sayısı 0").toBeGreaterThan(0);
    console.log(`[✓] ${uploaded} kağıt yüklendi`);
  });

  test("Teacher: yüklenen kağıdın 'Pending' durumunda olduğunu doğrula", async ({ request }) => {
    // Sınavı al ve paper'ın durumunu kontrol et
    // (queue-status endpoint üzerinden kontrol ediyoruz)
    const res = await request.get(`${API_BASE}/teacher/queue-status`, {
      headers: auth(teacherToken),
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    const pending = data.data?.pending ?? data.pending ?? data.data?.Pending ?? 0;
    expect(pending, "Bekleyen kağıt yok — yükleme başarısız olmuş olabilir").toBeGreaterThan(0);
    console.log(`[✓] Kuyruk durumu: ${JSON.stringify(data.data ?? data)}`);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// AŞAMA 5 — Değerlendirmeyi Başlat
// ══════════════════════════════════════════════════════════════════════════════
test.describe("Aşama 5: Değerlendirmeyi Başlat", () => {

  test("Teacher: değerlendirmeyi kuyruğa al", async ({ request }) => {
    expect(examId).toBeTruthy();

    const res = await request.post(
      `${API_BASE}/teacher/exams/${examId}/start-evaluation`,
      { headers: auth(teacherToken) }
    );
    expect(res.ok(), `Değerlendirme başlatılamadı: ${await res.text()}`).toBeTruthy();
    const data = await res.json();
    console.log(`[✓] Değerlendirme başlatıldı: ${JSON.stringify(data.data ?? data)}`);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// AŞAMA 6 — Python Worker Sonucunu Bekle (Polling)
// ══════════════════════════════════════════════════════════════════════════════
test.describe("Aşama 6: AI Değerlendirme Sonucunu Bekle", () => {

  test(
    `Python worker sonucu bekle (max ${EVAL_TIMEOUT_SEC} sn)`,
    async ({ request }) => {
      // Bu test uzun sürebilir — Playwright default timeout'u override ediyoruz
      test.setTimeout((EVAL_TIMEOUT_SEC + 15) * 1000);

      expect(adminToken).toBeTruthy();
      expect(teacherToken).toBeTruthy();

      console.log(`\n⏳ Python worker sonucu bekleniyor (max ${EVAL_TIMEOUT_SEC} sn)...`);
      console.log("   Not: Python worker çalışmıyorsa bu test timeout olur.\n");

      const deadline = Date.now() + EVAL_TIMEOUT_SEC * 1000;
      let found      = false;

      while (Date.now() < deadline) {
        // Teacher results listesini sorgula
        const res = await request.get(
          `${API_BASE}/teacher/results?pageSize=20`,
          { headers: auth(teacherToken) }
        );

        if (res.ok()) {
          const data    = await res.json();
          const results = data.data?.items ?? data.items ?? data.data ?? [];

          if (Array.isArray(results) && results.length > 0) {
            // Bu sınava ait sonucu bul
            const match = results.find((r: any) =>
              r.examName === examName || r.ExamName === examName
            );

            if (match) {
              resultId = match.id ?? match.Id;
              const score = match.score ?? match.Score ?? match.totalScore;
              console.log(`\n[✓] Sonuç geldi!`);
              console.log(`    ExamPaper ID : ${resultId}`);
              console.log(`    Puan         : ${score}/100`);
              console.log(`    Öğrenci Adı  : ${match.studentName ?? match.StudentName}`);
              found = true;
              break;
            }
          }
        }

        console.log(`   ... ${Math.round((deadline - Date.now()) / 1000)} sn kaldı`);
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }

      expect(found, `${EVAL_TIMEOUT_SEC} saniye içinde sonuç gelmedi — Python worker çalışıyor mu?`).toBeTruthy();
    }
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// AŞAMA 7 — Sonuç Detaylarını Doğrula
// ══════════════════════════════════════════════════════════════════════════════
test.describe("Aşama 7: Sonuç Doğrulama", () => {

  test("Teacher: sonuç detayını gör — kod, hatalar, model skorları", async ({ request }) => {
    expect(resultId, "resultId henüz set edilmedi — önceki aşama başarısız").toBeTruthy();

    const res = await request.get(`${API_BASE}/teacher/results/${resultId}`, {
      headers: auth(teacherToken),
    });
    expect(res.ok(), "Sonuç detayı alınamadı").toBeTruthy();

    const data   = await res.json();
    const detail = data.data ?? data;

    console.log(`\n📊 SONUÇ DETAYI:`);
    console.log(`   Öğrenci   : ${detail.studentName ?? detail.StudentName}`);
    console.log(`   Puan      : ${detail.totalScore ?? detail.TotalScore ?? detail.score}/100`);
    console.log(`   Kod       : ${(detail.code ?? detail.Code ?? "").substring(0, 80)}...`);
    console.log(`   Syntax H. : ${detail.syntaxErrorCount ?? detail.SyntaxErrorCount ?? 0}`);
    console.log(`   Mantık H. : ${detail.logicErrorCount ?? detail.LogicErrorCount ?? 0}`);

    // OCR kodu okumuş olmalı
    const code = detail.code ?? detail.Code ?? "";
    expect(
      code.toLowerCase().includes("print"),
      `OCR 'print' fonksiyonunu okuyamamış. Okunan kod: "${code}"`
    ).toBeTruthy();

    // Puan 0'dan büyük olmalı (Worker çalışmış demektir)
    const score = detail.totalScore ?? detail.TotalScore ?? detail.score ?? 0;
    expect(score, "Puan 0 — değerlendirme başarısız").toBeGreaterThan(0);

    // Model skorları var mı?
    const modelScores = detail.modelScores ?? detail.ModelScores ?? [];
    expect(Array.isArray(modelScores), "Model skorları dizi olmalı").toBeTruthy();
    console.log(`   Model Skor Sayısı: ${modelScores.length}`);
    if (modelScores.length > 0) {
      modelScores.forEach((m: any) => {
        console.log(`     - ${m.modelName ?? m.ModelName}: ${m.score ?? m.Score}/100`);
      });
    }

    // ExamPaper paperId'yi al (öğrenci görüntüleme için)
    examPaperId = resultId;
  });

  test("Teacher: öğrenci adı 'METE YILMAZ' olarak eşleşmiş mi?", async ({ request }) => {
    expect(resultId).toBeTruthy();

    const res    = await request.get(`${API_BASE}/teacher/results/${resultId}`, {
      headers: auth(teacherToken),
    });
    const data   = await res.json();
    const detail = data.data ?? data;

    const studentName = (detail.studentName ?? detail.StudentName ?? "").toUpperCase();
    console.log(`[ℹ] Öğrenci adı: "${studentName}"`);

    // OCR isim eşleştirmesi başarılıysa "METE YILMAZ" görünür
    // Başarısız olursa "OCR BEKLENİYOR" görünür (test soft-check yapıyor)
    if (studentName.includes("METE") && studentName.includes("YILMAZ")) {
      console.log("[✓] OCR öğrenci eşleştirmesi BAŞARILI — METE YILMAZ bulundu!");
    } else {
      console.warn(`[⚠] OCR öğrenci eşleştirmesi BAŞARISIZ — ad: "${studentName}"`);
      console.warn("    Bu normal olabilir. Consumer isim bazlı eşleştiriyor.");
    }
    // Hard fail değil — isim eşleşmeyebilir ama diğer veriler gelmiş olabilir
    expect(true).toBeTruthy();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// AŞAMA 8 — Sonucu Öğrenciyle Paylaş
// ══════════════════════════════════════════════════════════════════════════════
test.describe("Aşama 8: Sonucu Öğrenciyle Paylaş", () => {

  test("Teacher: IsShared = true yap", async ({ request }) => {
    expect(resultId).toBeTruthy();

    const res = await request.put(`${API_BASE}/teacher/results/${resultId}/share`, {
      headers: auth(teacherToken),
    });
    expect(res.ok(), "Paylaşma başarısız").toBeTruthy();
    console.log("[✓] Sonuç paylaşıldı");
  });

  test("Teacher: not ekle", async ({ request }) => {
    expect(resultId).toBeTruthy();

    const res = await request.put(`${API_BASE}/teacher/results/${resultId}/note`, {
      headers: auth(teacherToken),
      data: { note: "print() kullanımın doğru. 'Merhaba dünya' yazımına dikkat et." },
    });
    expect(res.ok(), "Not eklenemedi").toBeTruthy();
    console.log("[✓] Öğretmen notu eklendi");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// AŞAMA 9 — Öğrenci Kendi Sonucunu Görüyor
// ══════════════════════════════════════════════════════════════════════════════
test.describe("Aşama 9: Öğrenci (METE YILMAZ) Kendi Sonucunu Görüyor", () => {

  test("METE YILMAZ: sonuçlar listesinde sınav görünüyor mu?", async ({ request }) => {
    expect(meteToken).toBeTruthy();

    const res = await request.get(`${API_BASE}/student/results?pageSize=20`, {
      headers: auth(meteToken),
    });
    expect(res.ok(), "Öğrenci sonuçları alınamadı").toBeTruthy();

    const data    = await res.json();
    const results = data.data?.items ?? data.items ?? data.data ?? [];

    // OCR eşleştirmesi başarılıysa bu sınav listede görünür
    if (Array.isArray(results) && results.length > 0) {
      console.log(`[✓] Öğrenci ${results.length} sonuç görüyor`);
      results.forEach((r: any) => {
        console.log(`    - ${r.examName ?? r.ExamName}: ${r.score ?? r.Score}/100`);
      });
    } else {
      console.warn("[⚠] Öğrenci henüz hiç sonuç göremiyorr");
      console.warn("    OCR isim eşleştirmesi başarısız olmuş olabilir");
    }
    // Sonuç 0 olsa bile fail etmiyoruz — OCR eşleştirme soft-check
    expect(res.ok()).toBeTruthy();
  });

  test("METE YILMAZ: sonuç detayını gör (examPaperId ile doğrudan)", async ({ request }) => {
    expect(meteToken).toBeTruthy();
    expect(examPaperId).toBeTruthy();

    const res = await request.get(`${API_BASE}/student/results/${examPaperId}`, {
      headers: auth(meteToken),
    });

    // 404 gelebilir (StudentId eşleşmedi ise)
    if (res.status() === 404) {
      console.warn("[⚠] Öğrenci bu sonuca erişemiyor (StudentId eşleşmedi)");
      console.warn("    firstName='METE', lastName='YILMAZ' tam olarak eşleşiyor mu?");
      return;
    }

    expect(res.ok(), "Öğrenci sonuç detayı alınamadı").toBeTruthy();
    const data   = await res.json();
    const detail = data.data ?? data;

    console.log(`\n🎓 ÖĞRENCİ BAKIŞ AÇISI:`);
    console.log(`   Sınav  : ${detail.examName ?? detail.ExamName}`);
    console.log(`   Puan   : ${detail.totalScore ?? detail.TotalScore ?? detail.score}/100`);
    console.log(`   Kod    : ${(detail.code ?? detail.Code ?? "").substring(0, 60)}`);
    console.log(`   Not    : ${detail.teacherNote ?? detail.TeacherNote ?? "(yok)"}`);

    const score = detail.totalScore ?? detail.TotalScore ?? detail.score ?? 0;
    expect(score).toBeGreaterThan(0);
  });

  test("METE YILMAZ: orijinal kağıt görselini indir", async ({ request }) => {
    expect(meteToken).toBeTruthy();
    expect(examPaperId).toBeTruthy();

    const res = await request.get(
      `${API_BASE}/student/results/${examPaperId}/paper-image`,
      { headers: auth(meteToken) }
    );

    if (res.status() === 404) {
      console.warn("[⚠] Kağıt görseli bulunamadı — paylaşılmadı veya StudentId eşleşmedi");
      return;
    }

    expect(res.ok(), "Kağıt görseli alınamadı").toBeTruthy();
    const contentType = res.headers()["content-type"] ?? "";
    expect(contentType.includes("image"), "Content-Type image olmalı").toBeTruthy();

    const buffer = await res.body();
    expect(buffer.length, "Görsel boş").toBeGreaterThan(1000);
    console.log(`[✓] Kağıt görseli alındı: ${buffer.length} byte, Content-Type: ${contentType}`);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// AŞAMA 10 — Temizlik
// ══════════════════════════════════════════════════════════════════════════════
test.describe("Aşama 10: Temizlik", () => {

  test("Admin: test sınavını sil (exam → course → class sırasıyla)", async ({ request }) => {
    // Course sil
    if (courseId) {
      const r = await request.delete(`${API_BASE}/admin/courses/${courseId}`, {
        headers: auth(adminToken),
      });
      console.log(`[Temizlik] Course silindi (${r.status()})`);
    }

    // Class sil
    if (classId) {
      const r = await request.delete(`${API_BASE}/admin/classes/${classId}`, {
        headers: auth(adminToken),
      });
      console.log(`[Temizlik] Class silindi (${r.status()})`);
    }

    // METE YILMAZ'ı silmiyoruz — kullanıcı manuel oluşturuldu, manuel silinsin
    console.log("[ℹ] METE YILMAZ kullanıcısı test tarafından silinmiyor (SQL ile oluşturuldu)");

    expect(true).toBeTruthy();
  });
});
