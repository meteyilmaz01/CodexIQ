using CodexIQ.Application.DTOs.AdminDTOs;
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

    Task CreateUserAsync(CreateUserRequestDto request);
    Task UpdateUserAsync(Guid userId, UpdateUserRequestDto request);
    Task DeleteUserAsync(Guid userId);

    Task<List<AdminClassListItemDto>> GetClassesAsync();
    Task CreateClassAsync(CreateClassRequestDto request);
    Task CreateCourseAsync(CreateCourseRequestDto request);

    Task UpdateClassAsync(Guid id, UpdateClassRequestDto request);
    Task UpdateClassStatusAsync(Guid id, bool isActive);
    Task DeleteClassAsync(Guid id);

    Task UpdateCourseAsync(Guid id, UpdateCourseRequestDto request);
    Task UpdateCourseStatusAsync(Guid id, bool isActive);
    Task DeleteCourseAsync(Guid id);
    Task<PaginatedResult<AdminCourseListItemDto>> GetCoursesAsync(
        string? search, Guid? classId, bool? isActive, int page, int pageSize);

    Task<List<AdminActivityDto>> GetLogsAsync(int take);
    Task<AdminApiCostsDto> GetApiCostsAsync();
    Task<AdminQueueDto> GetQueueAsync();

    Task<List<AdminUserListItemDto>> GetStudentsByClassIdAsync(Guid classId);
    Task AssignStudentsToClassAsync(Guid classId, AssignStudentsRequestDto request);
    Task RemoveStudentFromClassAsync(Guid classId, Guid studentId);
}
