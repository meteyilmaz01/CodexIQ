# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Does

**CodexIQ** is an AI-powered education platform that grades student programming exam papers. Teachers upload scanned exam papers (image or PDF), a Python worker performs OCR and ensemble AI evaluation (Gemini + Groq Llama + Ollama), and the graded results are returned to the .NET backend via RabbitMQ. Students can view their results and paper images after the teacher shares them.

---

## Build & Run Commands

### Backend (.NET 10)
```bash
dotnet restore
dotnet build
dotnet watch run --project CodexIQ.Api   # hot reload, runs on http://localhost:5062
```

### Frontend (React + Vite)
```bash
cd ui/exam-grader
npm install
npm run dev      # http://localhost:5173
npm run build
```

### Python Worker
```bash
cd "project python"
pip install -r requirements.txt
python worker.py   # connects to RabbitMQ, listens for evaluate-exam-queue
```

### E2E Tests (Playwright)
```bash
cd ui/exam-grader
npm test                        # all tests
npx playwright test e2e/01-auth.spec.ts   # single file
npx playwright show-report      # view HTML report after run
```

Available test scripts: `test:auth`, `test:admin-api`, `test:teacher-api`, `test:student-api`, `test:messages-api`, `test:admin-ui`, `test:teacher-ui`, `test:student-ui`, `test:backend`, `test:frontend`.

**Never run tests programmatically — only the user runs them manually.**

---

## Architecture

### Layer Structure (Clean Architecture)

```
CodexIQ.Domain/          → Entities, Enums (no dependencies)
CodexIQ.Application/     → Interfaces, Services, DTOs, Validators
CodexIQ.Infrastructure/  → EF Core, Repositories, Messaging, SignalR, Auth
CodexIQ.Api/             → Controllers, Middlewares, Program.cs
ui/exam-grader/          → React 19 + TypeScript frontend
project python/          → AI grading worker (standalone)
```

### Key Domain Entities

All entities inherit `BaseEntity` (`Id: Guid`, `CreatedDate: DateTime UTC`, `IsActive: bool`).

- **ExamPaper** — Central entity. Has `StudentId: Guid?` (null until OCR matches a student), `ImagePath`, `Status` (Pending→Extracting→Evaluating→Completed/Failed)
- **FinalEvaluation** — One-to-one with ExamPaper; stores `TotalScore`, serialized error JSON, feedback
- **AIModelResult** — Three records per ExamPaper (Gemini, Groq, Ollama)
- **ExtractedCode** — OCR'd code text, one per ExamPaper
- **StudentClass** — Many-to-many junction between User (student) and Class

`UserRole` enum: `Student=1, Teacher=2, Admin=3`  
`EvaluationStatus` enum: `Pending=0, Extracting=1, Evaluating=2, Completed=3, Failed=4`

### API Controllers & Auth

| Controller | Route | Roles |
|---|---|---|
| AuthController | `/api/auth` | Public (login), Authorized (password change) |
| AdminController | `/api/admin` | Admin only |
| TeacherController | `/api/teacher` | Teacher only |
| StudentController | `/api/student` | Student only |
| MessageController | `/api/messages` | All authenticated |

### SignalR Hubs

- `/hubs/chat` — Authenticated users. JWT token passed as `?access_token=` query param (required for WebSocket auth — configured in `Program.cs` via `OnMessageReceived`). Methods: `JoinConversation`, `LeaveConversation`, `SendMessage`.
- `/hubs/logs` — Admin only. Streams log entries in real time.

### Message Queue (MassTransit + RabbitMQ)

**Flow**: Teacher triggers evaluation → .NET sends `EvaluateExamCommand` to `evaluate-exam-queue` (one per ExamPaper) → Python worker processes → Python publishes result JSON to `exam-results-queue` → .NET `ExamResultConsumer` saves results.

The `exam-results-queue` consumer uses `UseRawJsonDeserializer()` and `[JsonPropertyName]` attributes on `ExamResultPublished` to handle Turkish field names from Python (`toplam_puan`, `syntax_hatalari`, etc.).

`EvaluateExamCommand` fields: `ExamId`, `TeacherId`, `ExamPaperId`, `ImagePath`, `TeacherContext`, `ProgrammingLanguage`.

### File Storage

Base path: `C:\CodexIQ\Uploads` (configured in `appsettings.json`). PDFs are split page-by-page using PDFtoImage v5.0.0; each page saved as JPEG, each page creates a separate `ExamPaper` record with `StudentId = null`.

---

## Key Patterns & Gotchas

### JSON Enum Serialization
`JsonStringEnumConverter` is registered globally in `Program.cs`. Enums are sent/received as strings (`"Teacher"`, `"Student"`, `"Admin"`), not integers.

### Nullable StudentId Migration
`ExamPaper.StudentId` is `Guid?` — null on upload, filled by `ExamResultConsumer` after OCR matches a student by `FirstName + LastName`. If the DB column is still `NOT NULL`, run this SQL:
```sql
ALTER TABLE "ExamPapers" DROP CONSTRAINT IF EXISTS "FK_ExamPapers_Users_StudentId";
ALTER TABLE "ExamPapers" ALTER COLUMN "StudentId" DROP NOT NULL;
ALTER TABLE "ExamPapers" ADD CONSTRAINT "FK_ExamPapers_Users_StudentId"
    FOREIGN KEY ("StudentId") REFERENCES "Users"("Id") ON DELETE SET NULL;
```

### PendingModelChangesWarning
The manual migration for nullable StudentId causes EF Core to emit `PendingModelChangesWarning`. This is suppressed in `Program.cs` via `ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning))`.

### Frontend API Shape
`AdminUserListItemDto` returns `fullName` (combined string), not separate `firstName`/`lastName`. When mapping teacher dropdowns use `t.fullName`.

Teacher courses endpoint is `/api/teacher/courses` (NOT `/api/admin/courses` — that's Admin-only). `ExamUpload.tsx` uses `teacherApi.getCourses()`.

### Playwright Config
Uses **msedge channel** (not bundled Chromium). Workers=1 (serial). `waitForPageReady()` helper uses `domcontentloaded + 1000ms` — do NOT use `networkidle` (SignalR WebSocket blocks it). Default test timeout is 30s; long AI-evaluation polls use `test.setTimeout()` inside the test body.

### i18n
`useT()` hook reads from `translations.ts` (TR/EN). Zustand store has no persistence — language/theme reset to defaults (dark, TR) on page refresh.

### ExceptionHandlingMiddleware
Custom exceptions → HTTP codes: `ValidationException→400`, `UnauthorizedException→401`, `ForbiddenException→403`, `NotFoundException→404`. All unhandled exceptions → 500 with `"Beklenmeyen bir hata oluştu"`.

---

## External Dependencies Required

- **PostgreSQL** — `Host=localhost;Port=5432;Database=AsisDb;Username=postgres;Password=Mete!853`
- **RabbitMQ** — localhost:5672 (broker), localhost:15672 (management UI), credentials: guest/guest
- **Python worker** — must be running separately for exam grading to work
- **Gemini API key** + **Groq API key** — stored in `project python/.env`

## Test Credentials
- Admin: `admin@test.com` / `12345`
- Teacher: `teacher@codexiq.com` / `12345`
- Student: `celal@example.com` / `123456`
