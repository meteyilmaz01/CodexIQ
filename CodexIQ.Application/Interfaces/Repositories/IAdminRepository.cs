using CodexIQ.Domain.Entities;
using CodexIQ.Domain.Enums;

public interface IAdminRepository
{
    Task<AdminDashboardDto> GetDashboardAsync();
    Task<(List<AdminUserListItemDto> Items, int TotalCount)> GetUsersAsync(
        string? search, UserRole? role, bool? isActive, int page, int pageSize);
    Task<User?> GetUserEntityByIdAsync(Guid userId);

    Task<List<AdminAnnouncementDto>> GetAnnouncementsAsync();
    Task<Announcement?> GetAnnouncementEntityByIdAsync(Guid id);
    Task AddAnnouncementAsync(Announcement announcement);
    void UpdateAnnouncement(Announcement announcement);
    void DeleteAnnouncement(Announcement announcement);

    Task<List<AdminClassListItemDto>> GetClassesAsync();
    Task<bool> TeacherExistsAsync(Guid teacherId);
    Task<bool> ClassExistsAsync(Guid classId);
    Task AddClassAsync(Class classroom);
    Task AddCourseAsync(Course course);
    Task<Class?> GetClassEntityByIdAsync(Guid id);
    void UpdateClass(Class classroom);
    void DeleteClass(Class classroom);

    Task<List<AdminActivityDto>> GetLogsAsync(int take);
    Task<AdminApiCostsDto> GetApiCostsAsync();
    Task<AdminQueueDto> GetQueueAsync();
}
