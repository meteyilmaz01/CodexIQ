# CodexIQ.Api - Proje Devir Dokumani

## 1. PROJE GENEL BAKIS

CodexIQ, ogrencilerin kod sinavlarini AI ile degerlendiren bir egitim platformudur.

- **Backend**: .NET 10 Clean Architecture (`C:\Users\Win11\source\repos\CodexIQ.Api`)
- **Frontend**: React 19 + TypeScript + Vite (`ui/exam-grader/`)
- **UI Library**: Ant Design 6
- **State Management**: Zustand (`src/store/useAppStore.ts`)
- **HTTP Client**: Axios with interceptors (`src/api/axiosInstance.ts`)
- **i18n**: Custom hook `useT()` with `src/i18n/translations.ts` (TR/EN)
- **Real-time**: SignalR (`/hubs/chat` ve `/hubs/logs`)
- **Message Queue**: RabbitMQ + MassTransit
- **Database**: Entity Framework Core (Code First)

### Calisma URL'leri
- Backend API: `http://localhost:5062/api`
- Frontend: `http://localhost:5173`

### Test Kullanicilari
```
admin:   admin@test.com       / 12345
teacher: teacher@codexiq.com  / 12345
student: celal@example.com    / 123456
```

---

## 2. BACKEND YAPISI (Clean Architecture)

### Katmanlar
```
CodexIQ.Api/              → Controllers, Middlewares, Program.cs
CodexIQ.Application/      → Services, DTOs, Interfaces, Exceptions
CodexIQ.Domain/            → Entities, Enums
CodexIQ.Infrastructure/    → Repository, Persistence, Migrations, External Services
```

### Controllers (6 adet)
| Controller | Route | Auth | Aciklama |
|------------|-------|------|----------|
| AuthController | `/api/auth` | Public (login), Authorize (change-password) | Login + sifre degistirme |
| AdminController | `/api/admin` | `[Authorize(Roles = "Admin")]` | Users, Classes, Courses, Announcements, Logs, API Costs, Queue CRUD |
| TeacherController | `/api/teacher` | `[Authorize(Roles = "Teacher")]` | Dashboard, Results, Students, Profile, Exam Upload, Score Override, Export |
| StudentController | `/api/student` | `[Authorize(Roles = "Student")]` | Dashboard, Stats, Results, Profile |
| MessageController | `/api/messages` | `[Authorize]` | Mesajlasma (teachers list, students list, send, conversation, mark as read, unread count) |
| TestController | `/api/test` | ? | Kod test calistirma |

### Onemli DTO'lar ve Field Adlari (DIKKAT - Bug kaynaklari)
```
LoginRequestDto:           { email, password }
ChangePasswordRequestDto:  { currentPassword, newPassword }     ← "oldPassword" DEGIL!
CreateUserRequestDto:      { email, firstName, lastName, role, password }  ← role integer: 1=Student, 2=Teacher, 3=Admin
CreateClassRequestDto:     { name, teacherId }                  ← teacherId ZORUNLU (Guid)
CreateCourseRequestDto:    { name, classId }                    ← classId ZORUNLU (Guid)
SendMessageRequestDto:     { receiverId, text }                 ← "content" DEGIL, "text"!
UpdateUserStatusRequestDto: { isActive }
MessageDto (response):     { id, from, text, time, isRead }    ← "senderId"/"content" yok
```

### UserRole Enum (Integer)
```csharp
Student = 1
Teacher = 2
Admin = 3
```

### SignalR Hub'lari
- `/hubs/chat` — JWT auth, herkes (Authorize). Events: ReceiveMessage, UnreadCountUpdated. Methods: JoinConversation, LeaveConversation, SendMessage
- `/hubs/logs` — JWT auth, sadece Admin. Event: ReceiveLog

### Exception Handling
`ExceptionHandlingMiddleware` tum exception'lari yakalar:
- `UnauthorizedException` → 401
- `NotFoundException` → 404
- `ValidationException` → 400
- `ForbiddenException` → 403

---

## 3. FRONTEND YAPISI

### Dizin Yapisi
```
src/
  api/           → axiosInstance.ts, authApi.ts, adminApi.ts, teacherApi.ts, studentApi.ts, messageApi.ts
  components/    → HeaderActions.tsx (tema/dil toggle), layout bilesenleri
  hooks/         → useT.ts (i18n), useChatHub.ts (SignalR chat)
  i18n/          → translations.ts (TR/EN cevirileri)
  pages/
    admin/       → Dashboard, UserManagement, Announcements, ClassManagement, SystemLogs, ApiCosts, QueueMonitor
    teacher/     → Dashboard, ExamUpload, Results, ResultDetail, StudentList, TeacherMessages, TeacherProfile
    student/     → Dashboard, Results, ResultDetail, CodeTest, StudentMessages, Profile
    Login.tsx
  store/         → useAppStore.ts (Zustand - tema, dil, auth state)
  theme/         → themeConfig.ts (dark/light tema renkleri)
```

### Onemli Notlar
- Zustand `persist` middleware KULLANMIYOR — sayfa yenilendiginde dil ve tema sifirlanir (default: dark tema, TR dil)
- Axios interceptor: 401 alinca otomatik `/login`'e yonlendirir
- SignalR WebSocket baglantilari `networkidle` state'ini ENGELLER — Playwright'ta `domcontentloaded` + `waitForTimeout(1000)` kullanilmali

---

## 4. DUZELTILEN BUG'LAR

### Backend Bug'lari
| Bug | Dosya | Sorun | Duzeltme |
|-----|-------|-------|----------|
| Deactivated user login olabiliyor | `AuthService.cs` | `IsActive` kontrolu token uretiminden SONRA yapiliyordu | `IsActive` kontrolunu sifre dogrulamasindan sonra, token uretiminden ONCE'ye tasidik |

### Frontend Bug'lari
| Bug | Dosya | Sorun | Duzeltme |
|-----|-------|-------|----------|
| Sifre degistirme 400 hatasi | `src/api/authApi.ts` | `oldPassword` gonderiyordu | `currentPassword` olarak map'lendi |
| Mesaj gonderme 400 hatasi | `src/api/messageApi.ts` | `content` gonderiyordu | `text` olarak map'lendi |

### Hala Mevcut Olabilecek Sorunlar
- `GetStudentsForTeacherAsync` (mesajlasma) sadece `StudentClass` tablosunda o teacher'in sinifina atanmis ogrencileri dondurur. Sinifa ogrenci ekleme endpoint'i (`AddStudentToClass`) backend'de YOKTUR.
- Frontend'deki `messageApi.ts` → `sendMessage` fonksiyonu `{ receiverId, content }` arayuzu kabul eder ama icerde `{ receiverId, text }` olarak donusturur.
- Ant Design 6'da `List` component'i deprecated, `Drawer` width prop'u deprecated (`size` kullanilmali)

---

## 5. E2E TEST DOSYALARI (Playwright)

### Konfigurasyon
```
ui/exam-grader/playwright.config.ts
- Browser: Chromium with channel "msedge" (Windows'ta bundled Chromium calismaz)
- Base URL: http://localhost:5173
- Headless: false
- Workers: 1 (seri calistirma)
- Timeout: 30s
```

### Test Dosyalari (10 adet, ~252 test)
| Dosya | Test Sayisi | Kapsam |
|-------|-------------|--------|
| `01-auth.spec.ts` | ~23 | Login (3 rol), invalid creds, token validity, UI form validation |
| `02-admin-backend.spec.ts` | ~48 | Users CRUD, Announcements CRUD, Classes CRUD (teacherId ile), Courses CRUD, Logs, API Costs, Queue |
| `03-teacher-backend.spec.ts` | ~26 | Dashboard, Results, Score override, Notes, Share, Export, Students, Profile |
| `04-student-backend.spec.ts` | ~15 | Dashboard stats, Profile, Results |
| `05-messages-backend.spec.ts` | ~13 | Contacts, Send/receive (text field!), Conversation, Mark as read, Unread count |
| `06-admin-ui.spec.ts` | ~25 | Admin sayfalarinin UI testleri |
| `07-teacher-ui.spec.ts` | ~28 | Teacher sayfalarinin UI testleri |
| `08-student-ui.spec.ts` | ~34 | Student sayfalarinin UI testleri |
| `09-advanced.spec.ts` | ~24 | Language toggle, Real password change, Create user→login, Deactivate/reactivate, SignalR |
| `10-flows.spec.ts` | ~16 | Class→Course full flow, End-to-end messaging flow |

### Test Helper'lari (`e2e/helpers.ts`)
```typescript
API_BASE = "http://localhost:5062/api"
APP_URL = "http://localhost:5173"
TEST_USERS = { admin, teacher, student } // yukardaki credentials

loginViaUI(page, role)    // Form doldurarak login
loginViaAPI(page, role)   // API ile login, localStorage'a token yaz
getAuthToken(page, role)  // Sadece token al
waitForPageReady(page)    // domcontentloaded + 1000ms (networkidle KULLANMA!)
```

### Test Calistirma
```bash
cd ui/exam-grader
npx playwright test                           # Tum testler
npx playwright test e2e/10-flows.spec.ts      # Tek dosya
npx playwright test --grep "Step 1"           # Pattern ile
npx playwright show-report                    # HTML rapor
```

**ONEMLI KURAL**: Testleri SADECE kullanici manuel calistirir. Programatik olarak test calistirmayin.

---

## 6. PROJE DOSYA HARITALARI

### Backend Anahtar Dosyalar
```
CodexIQ.Api/Controllers/AuthController.cs        → Login + ChangePassword
CodexIQ.Api/Controllers/AdminController.cs       → Tum admin CRUD (users, classes, courses, announcements, logs, costs, queue)
CodexIQ.Api/Controllers/TeacherController.cs     → Teacher dashboard, results, students, profile, exam upload
CodexIQ.Api/Controllers/StudentController.cs     → Student dashboard, stats, results, profile
CodexIQ.Api/Controllers/MessageController.cs     → Mesajlasma (teachers, students, send, conversation, read, unread)
CodexIQ.Api/Middlewares/ExceptionHandlingMiddleware.cs → Global exception handler

CodexIQ.Application/Services/AuthService.cs      → Login logic + IsActive check + password change
CodexIQ.Application/Services/AdminService.cs     → Admin business logic
CodexIQ.Application/Services/MessageService.cs   → Message business logic
CodexIQ.Application/DTOs/                        → Tum DTO'lar (request/response)
CodexIQ.Application/Exceptions/                  → Custom exception'lar

CodexIQ.Domain/Entities/Entities/User.cs         → User entity (StudentClasses, TaughtClasses, Messages)
CodexIQ.Domain/Entities/Entities/Class.cs        → Class entity
CodexIQ.Domain/Entities/Entities/StudentClass.cs → Many-to-many (Student ↔ Class)
CodexIQ.Domain/Entities/Entities/Message.cs      → Message entity
CodexIQ.Domain/Enums/UserRole.cs                 → Student=1, Teacher=2, Admin=3

CodexIQ.Infrastructure/Repository/               → EF Core repository implementations
CodexIQ.Infrastructure/Persistence/CodexIQDbContext.cs → DbContext
```

### Frontend Anahtar Dosyalar
```
src/api/axiosInstance.ts     → Axios config (baseURL, token interceptor, 401 redirect)
src/api/authApi.ts           → login(), changePassword() ← currentPassword kullanir
src/api/messageApi.ts        → sendMessage() ← text field kullanir (content degil)
src/api/adminApi.ts          → Admin API calls
src/api/teacherApi.ts        → Teacher API calls
src/api/studentApi.ts        → Student API calls

src/store/useAppStore.ts     → Zustand store (theme, language, token, user, setLanguage, toggleTheme)
src/hooks/useT.ts            → i18n hook (translations[language][key])
src/hooks/useChatHub.ts      → SignalR chat connection hook
src/i18n/translations.ts     → TR/EN ceviri sozlugu
src/components/HeaderActions.tsx → Dil ve tema toggle butonlari
src/theme/themeConfig.ts     → Dark/light tema renkleri

e2e/helpers.ts               → Test yardimci fonksiyonlari
e2e/01-auth.spec.ts          → Auth testleri
...
e2e/10-flows.spec.ts         → Flow testleri
playwright.config.ts         → Playwright konfig (msedge channel!)
```

---

## 7. BILINEN KISITLAMALAR

1. **Sinifa ogrenci ekleme endpoint'i YOK** — `StudentClass` entity'si var ama admin controller'da ogrenci atama endpoint'i yok
2. **Zustand persist yok** — Sayfa yenilendiginde dil/tema sifirlanir
3. **Exam upload testi yok** — Gercek dosya + AI grading gerektirdigi icin E2E'de test edilmedi
4. **Ant Design 6 deprecation'lari** — `List` component'i ve `Drawer` width prop'u deprecated uyarisi veriyor
5. **`/messages/students` endpoint'i** sadece teacher'in sinifindaki ogrencileri dondurur (StudentClass tablosundan). Sinifa atanmamis ogrenciler gorulmez.

---

## 8. YAPILMIS DEGISIKLIKLER OZETI

Bu oturumda yapilan tum degisiklikler:

### Yeni Dosyalar (Test)
- `e2e/helpers.ts` — Test helper fonksiyonlari
- `e2e/01-auth.spec.ts` — Auth testleri
- `e2e/02-admin-backend.spec.ts` — Admin backend testleri
- `e2e/03-teacher-backend.spec.ts` — Teacher backend testleri
- `e2e/04-student-backend.spec.ts` — Student backend testleri
- `e2e/05-messages-backend.spec.ts` — Mesajlasma testleri
- `e2e/06-admin-ui.spec.ts` — Admin UI testleri
- `e2e/07-teacher-ui.spec.ts` — Teacher UI testleri
- `e2e/08-student-ui.spec.ts` — Student UI testleri
- `e2e/09-advanced.spec.ts` — Gelismis testler (dil, sifre, kullanici lifecycle, SignalR)
- `e2e/10-flows.spec.ts` — Uctan uca flow testleri (class+course, mesajlasma)

### Degistirilen Dosyalar (Bug Fix)
- `CodexIQ.Application/Services/AuthService.cs` — IsActive check sirasini duzeltme
- `ui/exam-grader/src/api/authApi.ts` — oldPassword → currentPassword mapping
- `ui/exam-grader/src/api/messageApi.ts` — content → text mapping
- `ui/exam-grader/playwright.config.ts` — msedge channel ekleme
