# CodexIQ - Proje Mimarisi

## Genel Bakış
AI destekli sınav kağıdı değerlendirme platformu. .NET 10 + React + PostgreSQL.

## Mimari: Clean Architecture + Repository Pattern + Unit of Work

## Katmanlar

### CodexIQ.Domain
- Entities: User, Exam, ExamPaper, FinalEvaluation, ExtractedCode, AIModelResult, Message, Class, Course, StudentClass, Announcement, RubricCriteria
- Enums: UserRole (Admin=0, Teacher=1, Student=2), EvaluationStatus (Pending=0, Extracting=1, Evaluating=2, Completed=3, Failed=4)
- Common: BaseEntity (Id, CreatedDate, IsActive)

### CodexIQ.Application
- Interfaces/CoreDataInterfaces: IRepository<T>, IUnitOfWork
- Interfaces/Repositories: IUserRepository, IStudentRepository, IMessageRepository, ITeacherRepository
- Interfaces/Services: IAuthService, IStudentService, IMessageService, ITeacherService
- Interfaces/Storage: IFileStorageService
- Interfaces/ExternalServices: IPasswordHasher, IJwtProvider
- Interfaces/RealTime: IChatNotificationService
- Services: AuthService, StudentService, MessageService, TeacherService
- DTOs: AuthDTOs, StudentsDTOs, MessageDTOs (StudentListItemDto dahil), TeacherDTOs (TeacherStudentListItemDto, TeacherStudentStatsDto, TeacherProfileDto, UpdateTeacherProfileRequestDto dahil), Common (PaginatedResult, ApiResponse)

### CodexIQ.Infrastructure
- Persistence: CodexIQDbContext, UnitOfWork
- Repository: UserRepository, StudentRepository, MessageRepository, TeacherRepository
- Authentication: PasswordHasher (BCrypt), JwtProvider
- Storage: FileStorageService (local disk)
- RealTime: ChatHub (SignalR), ChatNotificationService

### CodexIQ.Api
- Controllers: AuthController, StudentController, MessageController, TeacherController

## UnitOfWork Yapısı
```csharp
IUnitOfWork {
    IUserRepository User
    IStudentRepository Student
    IMessageRepository Message
    ITeacherRepository Teacher
    Task<int> SaveChangesAsync()
}
```

## Tamamlanan Backend Endpoint'leri

### Auth
- POST /api/auth/login
- PUT /api/auth/change-password

### Student
- GET /api/student/stats
- GET /api/student/recent-results
- GET /api/student/weak-topics
- GET /api/student/results (paginated, filterable)
- GET /api/student/results/{id} (detay + eğitim modu)
- GET /api/student/profile
- PUT /api/student/profile

### Messages (Student + Teacher ortak)
- GET /api/messages/teachers
- GET /api/messages/{teacherId}
- POST /api/messages
- PUT /api/messages/{messageId}/read
- GET /api/messages/unread-count
- GET /api/messages/students (Teacher perspektifi)

### Teacher Dashboard
- GET /api/teacher/stats
- GET /api/teacher/recent-uploads
- GET /api/teacher/course-averages
- GET /api/teacher/queue-status

### Teacher Exam Upload
- POST /api/teacher/exams
- POST /api/teacher/exams/{examId}/papers (multipart file upload)
- POST /api/teacher/exams/{examId}/rubric
- POST /api/teacher/exams/{examId}/start-evaluation

### Teacher Results
- GET /api/teacher/results (paginated, filterable)
- GET /api/teacher/results/{id}
- PUT /api/teacher/results/{id}/override
- PUT /api/teacher/results/{id}/note
- PUT /api/teacher/results/{id}/share
- PUT /api/teacher/results/bulk-share
- GET /api/teacher/results/export/excel?examId=
- GET /api/teacher/results/export/pdf?examId=

### Teacher Students
- GET /api/teacher/students?classId= (filtreleme: sınıf)
- GET /api/teacher/students/{id}/stats

### Teacher Profile
- GET /api/teacher/profile
- PUT /api/teacher/profile

## Henüz Yapılmamış
- Admin: Tüm CRUD endpoint'leri
- Student: Duyurular, Bildirimler
- Kod Test: Python entegrasyonu
- Frontend-Backend bağlantısı (axios + SignalR)
- RabbitMQ entegrasyonu

## Frontend
- React + TypeScript + Vite + Ant Design
- Tema: Dark/Light (Zustand store)
- Dil: TR/EN (translations.ts)
- Tüm sayfalar hazır: Login, Student (6 sayfa), Teacher (8 sayfa), Admin (8 sayfa)