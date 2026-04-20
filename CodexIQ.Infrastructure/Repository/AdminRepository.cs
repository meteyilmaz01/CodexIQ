using CodexIQ.Application.DTOs.AdminDTOs;
using CodexIQ.Application.Interfaces.Repositories;
using CodexIQ.Domain.Entities;
using CodexIQ.Domain.Enums;
using CodexIQ.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CodexIQ.Infrastructure.Repository
{
    public class AdminRepository : IAdminRepository
    {
        private readonly CodexIQDbContext _context;

        private static readonly Dictionary<string, decimal> ModelPrices = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Gemini 2.5 Flash"] = 0.0085m,
            ["Llama 3.1 8B"] = 0.0050m,
            ["DeepSeek"] = 0.0052m,
            ["Vision LLM"] = 0.0080m
        };

        public AdminRepository(CodexIQDbContext context)
        {
            _context = context;
        }

        public async Task<AdminDashboardDto> GetDashboardAsync()
        {
            var now = DateTime.UtcNow;
            var todayUtc = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0, DateTimeKind.Utc);
            var monthStartUtc = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            var totalUsers = await _context.Users.CountAsync();
            var totalTeachers = await _context.Users.CountAsync(x => x.Role == UserRole.Teacher);
            var totalStudents = await _context.Users.CountAsync(x => x.Role == UserRole.Student);
            var activeCourses = await _context.Courses.CountAsync(x => x.IsActive);
            var activeClasses = await _context.Classrooms.CountAsync(x => x.IsActive);
            var examsThisMonth = await _context.Exams.CountAsync(x => x.CreatedDate >= monthStartUtc);
            var announcementCount = await _context.Announcements.CountAsync(x => x.IsActive);

            var apiCosts = await GetApiCostsAsync();
            var activities = await GetLogsAsync(5);

            return new AdminDashboardDto
            {
                TotalUsers = totalUsers,
                TotalTeachers = totalTeachers,
                TotalStudents = totalStudents,
                DailyApiCost = apiCosts.DailyTotalCost,
                ActiveCourses = activeCourses,
                ActiveClasses = activeClasses,
                ExamsThisMonth = examsThisMonth,
                AnnouncementCount = announcementCount,
                ApiUsage = apiCosts.Items,
                RecentActivities = activities,
                SystemStatuses = new List<AdminSystemStatusDto>
        {
            new() { ServiceName = "API Gateway", Status = "Running", UptimePercent = 99.9, Note = "Kod çalışıyor" },
            new() { ServiceName = "RabbitMQ", Status = "Running", UptimePercent = 99.7, Note = "Queue akışı aktif" },
            new() { ServiceName = "PostgreSQL", Status = "Running", UptimePercent = 100, Note = "Bağlantı başarılı" },
            new() { ServiceName = "Gemini API", Status = "Warning", UptimePercent = 95.2, Note = "Gerçek health-check yok, tahmini veri" }
        }
            };
        }



        public async Task<(List<AdminUserListItemDto> Items, int TotalCount)> GetUsersAsync(
            string? search, UserRole? role, bool? isActive, int page, int pageSize)
        {
            var query = _context.Users.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.ToLower();
                query = query.Where(x =>
                    x.FirstName.ToLower().Contains(search) ||
                    x.LastName.ToLower().Contains(search) ||
                    x.Email.ToLower().Contains(search));
            }

            if (role.HasValue)
                query = query.Where(x => x.Role == role.Value);

            if (isActive.HasValue)
                query = query.Where(x => x.IsActive == isActive.Value);

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(x => x.CreatedDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new AdminUserListItemDto
                {
                    Id = x.Id,
                    FullName = x.FirstName + " " + x.LastName,
                    Email = x.Email,
                    Role = x.Role.ToString(),
                    StudentNumber = x.StudentNumber,
                    IsActive = x.IsActive,
                    CreatedDate = x.CreatedDate
                })
                .ToListAsync();

            return (items, totalCount);
        }

        public async Task<User?> GetUserEntityByIdAsync(Guid userId)
        {
            return await _context.Users.FirstOrDefaultAsync(x => x.Id == userId);
        }

        public async Task<List<AdminAnnouncementDto>> GetAnnouncementsAsync()
        {
            return await _context.Announcements
                .Include(x => x.Creator)
                .OrderByDescending(x => x.CreatedDate)
                .Select(x => new AdminAnnouncementDto
                {
                    Id = x.Id,
                    Title = x.Title,
                    Content = x.Content,
                    CreatedBy = x.CreatedBy,
                    CreatedByName = x.Creator.FirstName + " " + x.Creator.LastName,
                    CreatedDate = x.CreatedDate
                })
                .ToListAsync();
        }

        public async Task<Announcement?> GetAnnouncementEntityByIdAsync(Guid id)
        {
            return await _context.Announcements.FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task AddAnnouncementAsync(Announcement announcement)
        {
            await _context.Announcements.AddAsync(announcement);
        }

        public void UpdateAnnouncement(Announcement announcement)
        {
            _context.Announcements.Update(announcement);
        }

        public void DeleteAnnouncement(Announcement announcement)
        {
            _context.Announcements.Remove(announcement);
        }

        public async Task<List<AdminClassListItemDto>> GetClassesAsync()
        {
            return await _context.Classrooms
                .Include(x => x.Teacher)
                .Include(x => x.StudentClasses)
                .Include(x => x.Courses)
                .OrderByDescending(x => x.CreatedDate)
                .Select(x => new AdminClassListItemDto
                {
                    Id = x.Id,
                    Name = x.Name,
                    TeacherId = x.TeacherId,
                    TeacherName = x.Teacher.FirstName + " " + x.Teacher.LastName,
                    StudentCount = x.StudentClasses.Count,
                    CourseCount = x.Courses.Count,
                    CreatedDate = x.CreatedDate,
                    Courses = x.Courses.Select(c => new AdminCourseListItemDto
                    {
                        Id = c.Id,
                        Name = c.Name,
                        ClassId = c.ClassId,
                        CreatedDate = c.CreatedDate
                    }).ToList()
                })
                .ToListAsync();
        }

        public async Task<bool> TeacherExistsAsync(Guid teacherId)
        {
            return await _context.Users.AnyAsync(x => x.Id == teacherId && x.Role == UserRole.Teacher);
        }

        public async Task<bool> ClassExistsAsync(Guid classId)
        {
            return await _context.Classrooms.AnyAsync(x => x.Id == classId);
        }

        public async Task AddClassAsync(Class classroom)
        {
            await _context.Classrooms.AddAsync(classroom);
        }

        public async Task AddCourseAsync(Course course)
        {
            await _context.Courses.AddAsync(course);
        }

        public async Task<Class?> GetClassEntityByIdAsync(Guid id)
        {
            return await _context.Classrooms.FirstOrDefaultAsync(x => x.Id == id);
        }

        public void UpdateClass(Class classroom)
        {
            _context.Classrooms.Update(classroom);
        }

        public void DeleteClass(Class classroom)
        {
            _context.Classrooms.Remove(classroom);
        }

        public async Task<Course?> GetCourseEntityByIdAsync(Guid id)
    {
        return await _context.Courses.FirstOrDefaultAsync(x => x.Id == id);
    }

    public void UpdateCourse(Course course)
    {
        _context.Courses.Update(course);
    }

    public void DeleteCourse(Course course)
    {
        _context.Courses.Remove(course);
    }

    public async Task<(List<AdminCourseListItemDto> Items, int TotalCount)> GetCoursesAsync(
        string? search, Guid? classId, bool? isActive, int page, int pageSize)
    {
        var query = _context.Courses.Include(x => x.Class).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(x => x.Name.ToLower().Contains(search.ToLower()));

        if (classId.HasValue)
            query = query.Where(x => x.ClassId == classId.Value);

        if (isActive.HasValue)
            query = query.Where(x => x.IsActive == isActive.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(x => x.CreatedDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new AdminCourseListItemDto
            {
                Id = x.Id,
                Name = x.Name,
                ClassId = x.ClassId,
                ClassName = x.Class.Name,
                CreatedDate = x.CreatedDate
            })
            .ToListAsync();

        return (items, totalCount);
    }

        public async Task<List<AdminActivityDto>> GetLogsAsync(int take)
        {
            return await _context.Logs
                .OrderByDescending(l => l.TimeStamp)
                .Take(take)
                .Select(l => new AdminActivityDto
                {
                    Type = l.Level ?? "Info",
                    Message = !string.IsNullOrEmpty(l.UserName) && l.UserName != "Anonim"
                        ? $"[{l.UserName} ({l.UserRole})] {l.Message}"
                        : l.Message ?? string.Empty,
                    OccurredAt = l.TimeStamp
                })
                .ToListAsync();
        }

        public async Task<AdminApiCostsDto> GetApiCostsAsync()
        {
            var now = DateTime.UtcNow;
            var todayUtc = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0, DateTimeKind.Utc);

            var raw = await _context.AIModelResults
                .Where(x => x.CreatedDate >= todayUtc)
                .GroupBy(x => x.ModelName)
                .Select(g => new
                {
                    ModelName = g.Key,
                    CallCount = g.Count()
                })
                .ToListAsync();

            var items = raw.Select(x =>
            {
                var unitPrice = ModelPrices.TryGetValue(x.ModelName, out var price) ? price : 0.004m;
                return new AdminApiCostItemDto
                {
                    ModelName = x.ModelName,
                    CallCount = x.CallCount,
                    EstimatedCost = Math.Round(x.CallCount * unitPrice, 2)
                };
            }).OrderByDescending(x => x.EstimatedCost).ToList();

            return new AdminApiCostsDto
            {
                DailyTotalCost = items.Sum(x => x.EstimatedCost),
                Items = items
            };
        }


        public async Task<AdminQueueDto> GetQueueAsync()
        {
            var pending = await _context.ExamPapers.CountAsync(x => x.Status == EvaluationStatus.Pending);
            var extracting = await _context.ExamPapers.CountAsync(x => x.Status == EvaluationStatus.Extracting);
            var evaluating = await _context.ExamPapers.CountAsync(x => x.Status == EvaluationStatus.Evaluating);
            var completed = await _context.ExamPapers.CountAsync(x => x.Status == EvaluationStatus.Completed);
            var failed = await _context.ExamPapers.CountAsync(x => x.Status == EvaluationStatus.Failed);

            return new AdminQueueDto
            {
                Pending = pending,
                Extracting = extracting,
                Evaluating = evaluating,
                Completed = completed,
                Failed = failed,
                Total = pending + extracting + evaluating + completed + failed,
                Queues = new List<AdminQueueItemDto>
                {
                    new() { QueueName = "evaluate-exam-queue", TotalCount = pending, Status = "Active" },
                    new() { QueueName = "exam-results-queue", TotalCount = extracting + evaluating, Status = "Active" }
                }
            };
        }

        public async Task<List<AdminUserListItemDto>> GetStudentsByClassIdAsync(Guid classId)
        {
            return await _context.StudentClasses
                .Where(sc => sc.ClassId == classId)
                .Select(sc => new AdminUserListItemDto
                {
                    Id = sc.StudentId,
                    Email = sc.Student.Email,
                    FullName = sc.Student.FirstName + " " + sc.Student.LastName,
                    Role = sc.Student.Role.ToString(),
                    StudentNumber = sc.Student.StudentNumber,
                    IsActive = sc.Student.IsActive,
                    CreatedDate = sc.Student.CreatedDate
                })
                .ToListAsync();
        }

        public async Task AssignStudentsToClassAsync(Guid classId, List<Guid> studentIds)
        {
            var existing = await _context.StudentClasses
                .Where(sc => sc.ClassId == classId)
                .Select(sc => sc.StudentId)
                .ToListAsync();

            var toAdd = studentIds.Except(existing).ToList();

            foreach (var studentId in toAdd)
            {
                _context.StudentClasses.Add(new CodexIQ.Domain.Entities.StudentClass
                {
                    ClassId = classId,
                    StudentId = studentId
                });
            }
        }

        public async Task RemoveStudentFromClassAsync(Guid classId, Guid studentId)
        {
            var entry = await _context.StudentClasses
                .FirstOrDefaultAsync(sc => sc.ClassId == classId && sc.StudentId == studentId);
            if (entry != null)
                _context.StudentClasses.Remove(entry);
        }
    }
}