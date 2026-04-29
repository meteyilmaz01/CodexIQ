<div align="center">

# CodexIQ

### AI-Powered Programming Exam Grading Platform

[![.NET](https://img.shields.io/badge/.NET-10.0-512BD4?style=flat-square&logo=dotnet)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python)](https://python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)](https://postgresql.org/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.x-FF6600?style=flat-square&logo=rabbitmq)](https://rabbitmq.com/)

**CodexIQ**, el yazısıyla yazılmış programlama sınav kağıtlarını yapay zeka ile otomatik olarak değerlendiren bir eğitim platformudur. Öğretmenler taranmış sınav kağıtlarını yükler, üç farklı büyük dil modeli paralel olarak değerlendirme yapar ve sonuçlar öğrencilerle paylaşılır.

[Özellikler](#-özellikler) · [Mimari](#-mimari) · [API Referansı](#-api-referansı) · [Kurulum](#-kurulum) · [Teknoloji Yığını](#-teknoloji-yığını)

</div>

---

## Genel Bakış

Geleneksel sınav değerlendirme süreçleri zaman alıcı ve öğretmenler için yük oluşturmaktadır. CodexIQ bu süreci tamamen otomatize eder:

1. Öğretmen taranmış sınav kağıtlarını platforma yükler
2. Gemini Vision ile el yazısı OCR yapılır, öğrenci bilgisi ve kod çıkarılır
3. **Gemini**, **Groq Llama** ve **DeepSeek** üç paralel jüri olarak değerlendirme yapar
4. Bir hakem model (Groq Llama JSON mode) üç jürinin kararını sentezler
5. Syntax ve mantık hataları, rubrik puanları, kişisel geri bildirim üretilir
6. Öğrenci, kendi sınav kağıdını, puanını ve AI geri bildirimini platform üzerinden görür

---

## Özellikler

### Öğretmen
- Çoklu sınav kağıdı yükleme (PDF otomatik sayfa bölme + görsel)
- Rubrik tanımlama (kriter adı + maksimum puan)
- AI değerlendirmesini tek tıkla başlatma
- Not geçersiz kılma (manual override) ve öğretmen notu ekleme
- Sonuçları öğrencilerle toplu veya tekil paylaşma
- Excel (CSV) ve PDF export
- İtiraz taleplerini yönetme
- Öğrenci istatistikleri ve sınıf analitikleri

### Öğrenci
- Paylaşılan sınav sonuçlarını görüntüleme
- Orijinal sınav kağıdı görselini inceleme
- Syntax ve mantık hatalarının detaylı açıklamasını okuma
- Not itirazı oluşturma
- Kişisel zayıf konu analizi
- AI tarafından üretilen kişiselleştirilmiş gelişim önerileri
- El yazısı kodu OCR ile metne çevirme aracı
- Kod çalıştırma sandbox'ı
- Öğretmenlerle gerçek zamanlı mesajlaşma

### Admin
- Kullanıcı yönetimi (CRUD, rol atama, aktif/pasif)
- Sınıf ve ders yönetimi
- Duyuru oluşturma
- Gerçek zamanlı sistem log akışı
- API kullanım maliyeti takibi
- RabbitMQ kuyruk durumu izleme

---

## Mimari

```
┌─────────────────────────────────────────────────────────────────┐
│                         CodexIQ Platform                        │
├──────────────┬──────────────────────────┬───────────────────────┤
│  CodexIQ     │     CodexIQ.Api          │   CodexIQ.Frontend    │
│  .Worker     │     (.NET 10 REST API)   │   (React 19 + Vite)   │
│  (Python)    │                          │                        │
│              │  ┌────────────────────┐  │  ┌─────────────────┐  │
│  worker.py   │  │  CodexIQ.Api       │  │  │  Student UI     │  │
│  ┌─────────┐ │  │  (Controllers)     │  │  │  Teacher UI     │  │
│  │Gemini   │ │  ├────────────────────┤  │  │  Admin UI       │  │
│  │Vision   │ │  │  CodexIQ.          │  │  └────────┬────────┘  │
│  │OCR      │ │  │  Application       │  │           │            │
│  └────┬────┘ │  │  (Services/DTOs)   │  │      Axios + SignalR   │
│       │      │  ├────────────────────┤  │           │            │
│  ┌────▼────┐ │  │  CodexIQ.          │◄─┼───────────┘            │
│  │Ensemble │ │  │  Infrastructure    │  │                        │
│  │3x LLM   │ │  │  (EF Core/Auth/   │  │                        │
│  │Parallel │ │  │   MassTransit)     │  │                        │
│  └────┬────┘ │  ├────────────────────┤  │                        │
│       │      │  │  CodexIQ.Domain   │  │                        │
│  ┌────▼────┐ │  │  (Entities/Enums) │  │                        │
│  │Hakem    │ │  └────────┬───────────┘  │                        │
│  │(Judge)  │ │           │              │                        │
│  └────┬────┘ │      PostgreSQL          │                        │
│       │      │                          │                        │
│  insight_    │  ┌─────────────────────┐ │                        │
│  worker.py   │  │     RabbitMQ        │ │                        │
│              │  │  evaluate-exam-queue│ │                        │
│              │  │  exam-results-queue │ │                        │
│              │  │  generate-insight-q │ │                        │
│              │  │  insight-result-q   │ │                        │
└──────────────┴──┴─────────────────────┴─┴────────────────────────┘
```

### Katman Yapısı (Clean Architecture)

```
CodexIQ.Domain/          → Entity'ler, Enum'lar (bağımlılık yok)
CodexIQ.Application/     → Interface'ler, Service'ler, DTO'lar, Validatörler
CodexIQ.Infrastructure/  → EF Core, Repository, Messaging, SignalR, Auth
CodexIQ.Api/             → Controller'lar, Middleware, Program.cs
CodexIQ.Frontend/        → React 19 + TypeScript (Vite)
CodexIQ.Worker/          → Python AI değerlendirme worker'ı
```

### AI Değerlendirme Akışı

```
Sınav Kağıdı (PNG/PDF)
        │
        ▼
┌───────────────────┐
│  Gemini Vision    │  ← OCR: El yazısı → Kod metni
│  (Ön İşleme ile) │     Öğrenci adı + numarası tespiti
└────────┬──────────┘
         │
         ▼
┌─────────────────────────────────────┐
│         Paralel Jüri Değerlendirme  │
├───────────┬──────────┬──────────────┤
│  Gemini   │  Groq    │  DeepSeek    │
│  2.5 Flash│  Llama   │  V3 (free)   │
│           │  3.3 70B │              │
└───────────┴──────────┴──────┬───────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │  Hakem / Judge   │  ← Groq Llama (JSON mode)
                    │  Üç jüriyi       │    Çakışmaları çözer
                    │  sentezler       │    Yapılandırılmış çıktı
                    └────────┬─────────┘
                             │
                             ▼
               NihaiKararRaporu (JSON)
               ├── toplam_puan: 0-100
               ├── syntax_hatalari[]
               │   ├── satir, aciklama
               │   └── hint (düzeltme ipucu)
               ├── mantik_hatalari[]
               │   ├── neden yanlış
               │   └── doğru yaklaşım
               ├── gelisim_alanlari[]
               └── genel_degerlendirme
```

---

## API Referansı

### Auth

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `POST` | `/api/auth/login` | Giriş, JWT döner |
| `PUT` | `/api/auth/change-password` | Şifre değiştir |

### Admin `/api/admin` — `[Admin]`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/api/admin/dashboard` | Sistem istatistikleri |
| `GET` | `/api/admin/users` | Kullanıcı listesi (arama, rol, sayfalama) |
| `POST` | `/api/admin/users` | Yeni kullanıcı |
| `PUT` | `/api/admin/users/{id}` | Kullanıcı güncelle |
| `DELETE` | `/api/admin/users/{id}` | Kullanıcı sil |
| `PATCH` | `/api/admin/users/{id}/status` | Aktif/pasif |
| `GET` | `/api/admin/classes` | Sınıf listesi |
| `POST` | `/api/admin/classes` | Sınıf oluştur |
| `PUT` | `/api/admin/classes/{id}` | Sınıf güncelle |
| `DELETE` | `/api/admin/classes/{id}` | Sınıf sil |
| `GET` | `/api/admin/classes/{classId}/students` | Sınıf öğrencileri |
| `POST` | `/api/admin/classes/{classId}/students` | Öğrenci ata |
| `DELETE` | `/api/admin/classes/{classId}/students/{studentId}` | Öğrenciyi çıkar |
| `GET` | `/api/admin/courses` | Ders listesi |
| `POST` | `/api/admin/classes/courses` | Ders oluştur |
| `PUT` | `/api/admin/courses/{id}` | Ders güncelle |
| `DELETE` | `/api/admin/courses/{id}` | Ders sil |
| `GET` | `/api/admin/announcements` | Duyurular |
| `POST` | `/api/admin/announcements` | Duyuru oluştur |
| `PUT` | `/api/admin/announcements/{id}` | Duyuru güncelle |
| `DELETE` | `/api/admin/announcements/{id}` | Duyuru sil |
| `GET` | `/api/admin/logs` | Sistem logları |
| `GET` | `/api/admin/api-costs` | API kullanım maliyeti |
| `GET` | `/api/admin/queue` | Kuyruk durumu |

### Teacher `/api/teacher` — `[Teacher]`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/api/teacher/stats` | Öğretmen istatistikleri |
| `GET` | `/api/teacher/courses` | Dersler |
| `GET` | `/api/teacher/classes` | Sınıflar |
| `POST` | `/api/teacher/exams` | Sınav oluştur |
| `POST` | `/api/teacher/exams/{examId}/papers` | Kağıt yükle |
| `POST` | `/api/teacher/exams/{examId}/rubric` | Rubrik kaydet |
| `POST` | `/api/teacher/exams/{examId}/start-evaluation` | AI değerlendirmeyi başlat |
| `DELETE` | `/api/teacher/exams/{examId}` | Sınav sil |
| `DELETE` | `/api/teacher/papers/{examPaperId}` | Kağıt sil |
| `GET` | `/api/teacher/results` | Sonuç listesi (arama, filtre, sayfalama) |
| `GET` | `/api/teacher/results/{id}` | Sonuç detayı |
| `PUT` | `/api/teacher/results/{id}/override` | Not geçersiz kıl |
| `PUT` | `/api/teacher/results/{id}/rubric-scores` | Rubrik puanı güncelle |
| `PUT` | `/api/teacher/results/{id}/note` | Öğretmen notu ekle |
| `PUT` | `/api/teacher/results/{id}/share` | Sonucu paylaş |
| `PUT` | `/api/teacher/results/bulk-share` | Toplu paylaş |
| `GET` | `/api/teacher/results/export/excel` | CSV export |
| `GET` | `/api/teacher/results/export/pdf` | PDF export |
| `GET` | `/api/teacher/students` | Öğrenci listesi |
| `GET` | `/api/teacher/students/{id}/stats` | Öğrenci istatistikleri |
| `GET` | `/api/teacher/regrade-requests` | İtiraz talepleri |
| `GET` | `/api/teacher/regrade-requests/count` | Bekleyen itiraz sayısı |
| `POST` | `/api/teacher/regrade-requests/{requestId}/resolve` | İtirazı çöz |
| `GET` | `/api/teacher/analytics/exams` | Sınav analitiği |
| `GET` | `/api/teacher/analytics/top-errors` | En sık hatalar |
| `GET` | `/api/teacher/queue-status` | Değerlendirme kuyruğu durumu |

### Student `/api/student` — `[Student]`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/api/student/stats` | Öğrenci istatistikleri |
| `GET` | `/api/student/results` | Sonuç listesi |
| `GET` | `/api/student/results/{id}` | Sonuç detayı |
| `GET` | `/api/student/results/{id}/paper-image` | Sınav kağıdı görseli |
| `POST` | `/api/student/results/{id}/regrade-request` | Not itirazı oluştur |
| `GET` | `/api/student/results/{id}/regrade-request` | İtiraz durumu |
| `GET` | `/api/student/weak-topics` | Zayıf konular analizi |
| `GET` | `/api/student/insight` | Kişisel gelişim önerileri |
| `GET` | `/api/student/analytics/progress` | İlerleme analitiği |
| `GET` | `/api/student/analytics/error-summary` | Hata özeti |
| `GET` | `/api/student/announcements` | Duyurular |
| `POST` | `/api/student/convert-code` | El yazısı → Metin (OCR) |
| `POST` | `/api/student/run-code` | Kod çalıştır |
| `POST` | `/api/student/join-class` | Kod ile sınıfa katıl |

### Messages `/api/messages` — `[Authenticated]`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/api/messages/teachers` | Öğretmen listesi |
| `GET` | `/api/messages/students` | Öğrenci listesi |
| `GET` | `/api/messages/{userId}` | Konuşma geçmişi |
| `POST` | `/api/messages` | Mesaj gönder |
| `PUT` | `/api/messages/{messageId}/read` | Okundu işaretle |
| `GET` | `/api/messages/unread-count` | Okunmamış sayısı |

### SignalR Hubs

| Hub | Endpoint | Roller | Açıklama |
|-----|----------|--------|----------|
| `ChatHub` | `/hubs/chat` | Authenticated | Gerçek zamanlı mesajlaşma |
| `LogHub` | `/hubs/logs` | Admin | Canlı sistem log akışı |

> JWT token WebSocket auth için `?access_token=<token>` query parametresi olarak gönderilir.

---

## Teknoloji Yığını

### Backend

| Katman | Teknoloji |
|--------|-----------|
| Framework | ASP.NET Core 10.0 |
| ORM | Entity Framework Core 10 + Npgsql |
| Veritabanı | PostgreSQL 16 |
| Mesaj Kuyruğu | RabbitMQ + MassTransit 8.3 |
| Kimlik Doğrulama | JWT Bearer |
| Gerçek Zamanlı | ASP.NET Core SignalR |
| Loglama | Serilog → PostgreSQL + Console |
| Validasyon | FluentValidation |
| PDF İşleme | PDFtoImage, QuestPDF |
| Şifreleme | BCrypt.Net |
| API Dökümantasyonu | Swagger / OpenAPI |

### Frontend

| Kategori | Teknoloji |
|----------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| UI Kütüphanesi | Ant Design 6 |
| State | Zustand |
| Server State | TanStack Query |
| HTTP | Axios |
| Grafikler | Recharts |
| Gerçek Zamanlı | @microsoft/signalr |
| Test | Playwright |

### Python Worker

| Kategori | Teknoloji |
|----------|-----------|
| OCR | Gemini 2.5 Flash Vision |
| Ensemble | Groq Llama 3.3 70B + DeepSeek V3 |
| Hakem | Groq Llama 3.3 70B (JSON mode) |
| Görsel Fallback | Groq Llama 4 Scout Vision |
| Görüntü İşleme | Pillow (grayscale, kontrast, keskinleştirme) |
| Mesaj Kuyruğu | pika (RabbitMQ) |
| Veri Doğrulama | Pydantic |
| Web Sunucusu | Flask |

---

## Domain Modeli

```
User (Student / Teacher / Admin)
 ├── StudentClass (M:N) ──► Class
 │                           └── Course
 │                                └── Exam
 │                                     ├── RubricCriteria[]
 │                                     └── ExamPaper
 │                                          ├── ExtractedCode
 │                                          ├── AIModelResult[]  (Gemini, Groq, DeepSeek)
 │                                          └── FinalEvaluation
 │                                               ├── FinalScore
 │                                               ├── SyntaxErrorsJson
 │                                               ├── LogicErrorsJson
 │                                               ├── RubricScoresJson
 │                                               └── TeacherNote
 ├── Message[] (Student ↔ Teacher)
 ├── RegradeRequest[]
 └── StudentInsight
      ├── InsightText (AI üretimi)
      └── IsInsightDirty (yeniden üretilmeli mi)
```

**Enum'lar:**

| Enum | Değerler |
|------|---------|
| `UserRole` | `Student`, `Teacher`, `Admin` |
| `EvaluationStatus` | `Pending`, `Extracting`, `Evaluating`, `Completed`, `Failed` |
| `RegradeStatus` | `Pending`, `Approved`, `Rejected` |

---

## Kurulum

### Gereksinimler

- .NET 10 SDK
- Node.js 20+
- Python 3.11+
- PostgreSQL 16
- RabbitMQ 3.x

### 1. Veritabanı

```sql
CREATE DATABASE AsisDb;
```

```bash
cd CodexIQ.Api
dotnet ef database update
```

### 2. Backend

```bash
dotnet restore
dotnet watch run --project CodexIQ.Api
# http://localhost:5062
```

### 3. Frontend

```bash
cd CodexIQ.Frontend/exam-grader
npm install
npm run dev
# http://localhost:5173
```

### 4. Python Worker

```bash
cd CodexIQ.Worker
pip install -r requirements.txt

# .env dosyası oluştur
cp .env.example .env
# GOOGLE_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY değerlerini gir
```

```bash
python worker.py           # Sınav değerlendirme worker'ı
python insight_worker.py   # Öğrenci insight worker'ı
```

### Environment Değişkenleri

`CodexIQ.Worker/.env`:
```env
GOOGLE_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
OPENROUTER_API_KEY=your_openrouter_key
RABBITMQ_HOST=localhost
RABBITMQ_USER=guest
RABBITMQ_PASS=guest
FILE_STORAGE_BASE=C:\CodexIQ\Uploads
```

`CodexIQ.Api/appsettings.json` (Development):
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=AsisDb;Username=postgres;Password=yourpassword"
  },
  "Jwt": {
    "SecretKey": "your_secret_key",
    "Issuer": "CodexIQ",
    "Audience": "CodexIQ"
  },
  "FileStorage": {
    "BasePath": "C:\\CodexIQ\\Uploads"
  }
}
```

---

## Mesaj Kuyruğu Akışı

```
.NET (Teacher tetikler)
        │
        │  EvaluateExamCommand
        ▼
┌───────────────────────┐
│  evaluate-exam-queue  │
└───────────┬───────────┘
            │
            ▼ (worker.py dinler)
        [OCR + 3 Jüri + Hakem]
            │
            │  ExamResultPublished (JSON)
            ▼
┌───────────────────────┐
│  exam-results-queue   │
└───────────┬───────────┘
            │
            ▼ (ExamResultConsumer dinler)
        [DB'ye kaydet + StudentId eşleştir]
            │
            │  GenerateInsightCommand
            ▼
┌──────────────────────────┐
│  generate-insight-queue  │
└───────────┬──────────────┘
            │
            ▼ (insight_worker.py dinler)
        [Groq → Kişisel Öneriler]
            │
            │  InsightResultPublished
            ▼
┌──────────────────────────┐
│  insight-result-queue    │
└───────────┬──────────────┘
            │
            ▼ (InsightResultConsumer dinler)
        [StudentInsight DB'ye kaydet]
```

---

## Proje Yapısı

```
CodexIQ.Api/
├── CodexIQ.Api/                    # Web API katmanı
│   ├── Controllers/
│   │   ├── AuthController.cs
│   │   ├── AdminController.cs
│   │   ├── TeacherController.cs
│   │   ├── StudentController.cs
│   │   └── MessageController.cs
│   ├── Middlewares/
│   │   └── ExceptionHandlingMiddleware.cs
│   └── Program.cs
├── CodexIQ.Application/            # İş mantığı katmanı
│   ├── DTOs/
│   ├── Interfaces/
│   ├── Services/
│   └── Validators/
├── CodexIQ.Domain/                 # Domain katmanı
│   ├── Entities/
│   └── Enums/
├── CodexIQ.Infrastructure/         # Altyapı katmanı
│   ├── Messaging/                  # MassTransit consumers
│   ├── Persistence/                # DbContext, migrations
│   ├── RealTime/                   # SignalR hubs
│   └── Repository/
├── CodexIQ.Frontend/               # React frontend
│   └── exam-grader/
│       ├── src/
│       │   ├── api/               # Axios API çağrıları
│       │   ├── pages/             # Admin, Teacher, Student sayfaları
│       │   ├── components/        # Ortak bileşenler
│       │   ├── hooks/             # useT(), useThemeColors()
│       │   ├── i18n/              # TR/EN çeviriler
│       │   └── store/             # Zustand store
│       └── e2e/                   # Playwright testleri
└── CodexIQ.Worker/                 # Python AI worker
    ├── worker.py                   # Sınav değerlendirme
    ├── insight_worker.py           # Gelişim önerileri
    └── requirements.txt
```

---

## Güvenlik

- **JWT Bearer** kimlik doğrulama — tüm korumalı endpoint'lerde zorunlu
- **Rol tabanlı yetkilendirme** — `[Admin]`, `[Teacher]`, `[Student]` ayrımı
- **BCrypt** şifre hash'leme
- **FluentValidation** ile giriş doğrulama
- **ExceptionHandlingMiddleware** — stack trace'i client'a sızdırmaz
- Hassas konfigürasyon `appsettings.Development.json` ve `.env` içinde — Git'e eklenmez

---

## Test

```bash
cd CodexIQ.Frontend/exam-grader

npm test                              # Tüm testler
npm run test:auth                     # Auth testleri
npm run test:teacher-ui               # Öğretmen UI testleri
npm run test:student-ui               # Öğrenci UI testleri
npm run test:admin-ui                 # Admin UI testleri
npm run test:backend                  # Backend API testleri
npx playwright show-report            # Test raporunu görüntüle
```

> Testler **msedge** kanalını kullanır, seri olarak (workers=1) çalışır.

---

<div align="center">

**CodexIQ** — Yapay Zeka ile Sınav Değerlendirmesini Yeniden Tanımlıyoruz

</div>
