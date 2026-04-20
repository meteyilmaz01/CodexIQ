using CodexIQ.Application.DTOs.AdminDTOs;
using CodexIQ.Application.Exceptions;
using CodexIQ.Application.Interfaces.CoreDataInterfaces;
using CodexIQ.Application.Interfaces.ExternalServices;

public class AdminService : IAdminService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IRabbitMqManagementService _rabbitMqService;

    public AdminService(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher, IRabbitMqManagementService rabbitMqService)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _rabbitMqService = rabbitMqService;
    }

    public async Task<AdminDashboardDto> GetDashboardAsync()
        => await _unitOfWork.Admin.GetDashboardAsync();

    public async Task<PaginatedResult<AdminUserListItemDto>> GetUsersAsync(
        string? search, CodexIQ.Domain.Enums.UserRole? role, bool? isActive, int page, int pageSize)
    {
        var (items, totalCount) = await _unitOfWork.Admin.GetUsersAsync(search, role, isActive, page, pageSize);

        return new PaginatedResult<AdminUserListItemDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task UpdateUserStatusAsync(Guid userId, bool isActive)
    {
        var user = await _unitOfWork.Admin.GetUserEntityByIdAsync(userId);
        if (user == null) throw new NotFoundException("Kullanıcı bulunamadı");

        user.IsActive = isActive;
        _unitOfWork.User.Update(user);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<List<AdminAnnouncementDto>> GetAnnouncementsAsync()
        => await _unitOfWork.Admin.GetAnnouncementsAsync();

    public async Task CreateAnnouncementAsync(Guid adminId, CreateAnnouncementRequestDto request)
    {
        var entity = new CodexIQ.Domain.Entities.Announcement
        {
            Title = request.Title,
            Content = request.Content,
            CreatedBy = adminId
        };

        await _unitOfWork.Admin.AddAnnouncementAsync(entity);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task UpdateAnnouncementAsync(Guid id, UpdateAnnouncementRequestDto request)
    {
        var entity = await _unitOfWork.Admin.GetAnnouncementEntityByIdAsync(id);
        if (entity == null) throw new NotFoundException("Duyuru bulunamadı");

        entity.Title = request.Title;
        entity.Content = request.Content;

        _unitOfWork.Admin.UpdateAnnouncement(entity);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task DeleteAnnouncementAsync(Guid id)
    {
        var entity = await _unitOfWork.Admin.GetAnnouncementEntityByIdAsync(id);
        if (entity == null) throw new NotFoundException("Duyuru bulunamadı");

        _unitOfWork.Admin.DeleteAnnouncement(entity);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task CreateUserAsync(CreateUserRequestDto request)
    {
        var existingUser = await _unitOfWork.User.GetByEmailAsync(request.Email);
        if (existingUser != null)
            throw new BusinessException("Bu e-posta adresi zaten kullanılıyor.");

        var user = new CodexIQ.Domain.Entities.User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Role = request.Role,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            StudentNumber = request.StudentNumber,
            IsActive = true
        };

        await _unitOfWork.User.AddAsync(user);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task UpdateUserAsync(Guid userId, UpdateUserRequestDto request)
    {
        var user = await _unitOfWork.Admin.GetUserEntityByIdAsync(userId);
        if (user == null)
            throw new NotFoundException("Kullanıcı bulunamadı");

        if (user.Email != request.Email)
        {
            var existingUser = await _unitOfWork.User.GetByEmailAsync(request.Email);
            if (existingUser != null)
                throw new BusinessException("Bu e-posta adresi zaten kullanılıyor.");
        }

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.Email = request.Email;
        user.Role = request.Role;

        _unitOfWork.User.Update(user);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task DeleteUserAsync(Guid userId)
    {
        var user = await _unitOfWork.Admin.GetUserEntityByIdAsync(userId);
        if (user == null)
            throw new NotFoundException("Kullanıcı bulunamadı");

        _unitOfWork.User.Delete(user);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<List<AdminClassListItemDto>> GetClassesAsync()
        => await _unitOfWork.Admin.GetClassesAsync();

    public async Task CreateClassAsync(CreateClassRequestDto request)
    {
        var teacherExists = await _unitOfWork.Admin.TeacherExistsAsync(request.TeacherId);
        if (!teacherExists) throw new NotFoundException("Geçerli bir öğretmen bulunamadı");

        var entity = new CodexIQ.Domain.Entities.Class
        {
            Name = request.Name,
            TeacherId = request.TeacherId
        };

        await _unitOfWork.Admin.AddClassAsync(entity);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task CreateCourseAsync(CreateCourseRequestDto request)
    {
        var classExists = await _unitOfWork.Admin.ClassExistsAsync(request.ClassId);
        if (!classExists) throw new NotFoundException("Sınıf bulunamadı");

        var entity = new CodexIQ.Domain.Entities.Course
        {
            Name = request.Name,
            ClassId = request.ClassId
        };

        await _unitOfWork.Admin.AddCourseAsync(entity);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task UpdateClassAsync(Guid id, UpdateClassRequestDto request)
    {
        var classroom = await _unitOfWork.Admin.GetClassEntityByIdAsync(id);
        if (classroom == null) throw new NotFoundException("Sınıf bulunamadı");

        var teacherExists = await _unitOfWork.Admin.TeacherExistsAsync(request.TeacherId);
        if (!teacherExists) throw new NotFoundException("Seçilen öğretmen bulunamadı");

        classroom.Name = request.Name;
        classroom.TeacherId = request.TeacherId;

        _unitOfWork.Admin.UpdateClass(classroom);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task UpdateClassStatusAsync(Guid id, bool isActive)
    {
        var classroom = await _unitOfWork.Admin.GetClassEntityByIdAsync(id);
        if (classroom == null) throw new NotFoundException("Sınıf bulunamadı");

        classroom.IsActive = isActive;

        _unitOfWork.Admin.UpdateClass(classroom);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task DeleteClassAsync(Guid id)
    {
        var classroom = await _unitOfWork.Admin.GetClassEntityByIdAsync(id);
        if (classroom == null) throw new NotFoundException("Sınıf bulunamadı");
        _unitOfWork.Admin.DeleteClass(classroom);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task UpdateCourseAsync(Guid id, UpdateCourseRequestDto request)
    {
        var course = await _unitOfWork.Admin.GetCourseEntityByIdAsync(id);
        if (course == null) throw new NotFoundException("Ders bulunamadı");

        var classExists = await _unitOfWork.Admin.ClassExistsAsync(request.ClassId);
        if (!classExists) throw new NotFoundException("Seçilen sınıf bulunamadı");

        course.Name = request.Name;
        course.ClassId = request.ClassId;

        _unitOfWork.Admin.UpdateCourse(course);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task UpdateCourseStatusAsync(Guid id, bool isActive)
    {
        var course = await _unitOfWork.Admin.GetCourseEntityByIdAsync(id);
        if (course == null) throw new NotFoundException("Ders bulunamadı");

        course.IsActive = isActive;
        _unitOfWork.Admin.UpdateCourse(course);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task DeleteCourseAsync(Guid id)
    {
        var course = await _unitOfWork.Admin.GetCourseEntityByIdAsync(id);
        if (course == null) throw new NotFoundException("Ders bulunamadı");

        _unitOfWork.Admin.DeleteCourse(course);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<PaginatedResult<AdminCourseListItemDto>> GetCoursesAsync(
        string? search, Guid? classId, bool? isActive, int page, int pageSize)
    {
        var (items, totalCount) = await _unitOfWork.Admin.GetCoursesAsync(search, classId, isActive, page, pageSize);

        return new PaginatedResult<AdminCourseListItemDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<List<AdminActivityDto>> GetLogsAsync(int take)
        => await _unitOfWork.Admin.GetLogsAsync(take);

    public async Task<AdminApiCostsDto> GetApiCostsAsync()
        => await _unitOfWork.Admin.GetApiCostsAsync();

    public async Task<AdminQueueDto> GetQueueAsync()
    {
        var queueDto = await _unitOfWork.Admin.GetQueueAsync();

        var realQueues = await _rabbitMqService.GetQueuesAsync();

        if (realQueues != null && realQueues.Any())
        {
            queueDto.Queues = realQueues
                .Where(q => q.Name.Contains("exam") || q.Name.Contains("error") || q.Name.Contains("dead"))
                .Select(q => new AdminQueueItemDto
                {
                    QueueName = q.Name,
                    ReadyCount = q.MessagesReady,
                    UnackedCount = q.MessagesUnacknowledged,
                    TotalCount = q.Messages,
                    Status = q.State == "running" ? "Active" : "Idle"
                })
                .ToList();
        }

        return queueDto;
    }

    public async Task<List<AdminUserListItemDto>> GetStudentsByClassIdAsync(Guid classId)
    {
        return await _unitOfWork.Admin.GetStudentsByClassIdAsync(classId);
    }

    public async Task AssignStudentsToClassAsync(Guid classId, AssignStudentsRequestDto request)
    {
        var classEntity = await _unitOfWork.Admin.GetClassEntityByIdAsync(classId);
        if (classEntity == null) throw new CodexIQ.Application.Exceptions.NotFoundException("Sınıf bulunamadı");

        await _unitOfWork.Admin.AssignStudentsToClassAsync(classId, request.StudentIds);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task RemoveStudentFromClassAsync(Guid classId, Guid studentId)
    {
        await _unitOfWork.Admin.RemoveStudentFromClassAsync(classId, studentId);
        await _unitOfWork.SaveChangesAsync();
    }
}
