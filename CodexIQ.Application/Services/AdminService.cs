using CodexIQ.Application.Exceptions;
using CodexIQ.Application.Interfaces.CoreDataInterfaces;

public class AdminService : IAdminService
{
    private readonly IUnitOfWork _unitOfWork;

    public AdminService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
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

    public async Task<List<AdminActivityDto>> GetLogsAsync(int take)
        => await _unitOfWork.Admin.GetLogsAsync(take);

    public async Task<AdminApiCostsDto> GetApiCostsAsync()
        => await _unitOfWork.Admin.GetApiCostsAsync();

    public async Task<AdminQueueDto> GetQueueAsync()
        => await _unitOfWork.Admin.GetQueueAsync();
}
