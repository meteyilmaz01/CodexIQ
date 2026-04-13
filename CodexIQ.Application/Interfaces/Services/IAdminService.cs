using CodexIQ.Domain.Enums;

public interface IAdminService
{
    Task<AdminDashboardDto> GetDashboardAsync();
    Task<PaginatedResult<AdminUserListItemDto>> GetUsersAsync(
        string? search, UserRole? role, bool? isActive, int page, int pageSize);
    Task UpdateUserStatusAsync(Guid userId, bool isActive);

    Task<List<AdminAnnouncementDto>> GetAnnouncementsAsync();
    Task CreateAnnouncementAsync(Guid adminId, CreateAnnouncementRequestDto request);
    Task UpdateAnnouncementAsync(Guid id, UpdateAnnouncementRequestDto request);
    Task DeleteAnnouncementAsync(Guid id);

    Task<List<AdminClassListItemDto>> GetClassesAsync();
    Task CreateClassAsync(CreateClassRequestDto request);
    Task CreateCourseAsync(CreateCourseRequestDto request);

    Task<List<AdminActivityDto>> GetLogsAsync(int take);
    Task<AdminApiCostsDto> GetApiCostsAsync();
    Task<AdminQueueDto> GetQueueAsync();
}
