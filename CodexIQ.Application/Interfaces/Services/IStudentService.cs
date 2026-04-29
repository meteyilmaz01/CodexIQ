using CodexIQ.Application.DTOs.StudentsDTOs.StudentDashboardDTOS;
using System;
using System.Collections.Generic;
using System.Text;

namespace CodexIQ.Application.Interfaces.Services
{
    public interface IStudentService
    {
        Task<StatsDto> GetStatsDashboardAsync(Guid studentId);

        Task<List<RecentResultsDto>> GetRecentResultsAsync(Guid studentId);

        Task<List<WeakTopicsDto>> GetWeakTopicsAsync(Guid studentId);

        Task<PaginatedResult<ExamResultListItemDto>> GetExamResultsAsync(
            Guid studentId, string? search, string? course, string? sortBy, int page, int pageSize);

        Task<ExamResultDetailDto?> GetExamResultDetailAsync(Guid studentId, Guid examPaperId);

        /// <summary>
        /// Öğrencinin kendi sınav kağıdının orijinal görselini döndürür.
        /// Sonuç öğretmen tarafından paylaşılmamışsa null döner.
        /// </summary>
        Task<byte[]?> GetExamPaperImageAsync(Guid studentId, Guid examPaperId);

        Task<StudentProfileDto> GetProfileAsync(Guid studentId);
        Task UpdateProfileAsync(Guid studentId, UpdateProfileRequestDto request);

        Task<List<AdminAnnouncementDto>> GetAnnouncementsAsync();
        Task<List<ExamNotificationDto>> GetExamNotificationsAsync(Guid studentId);

        Task<JoinClassResultDto> JoinClassAsync(Guid studentId, string joinCode);

        Task CreateRegradeRequestAsync(Guid studentId, Guid examPaperId, string reason);
        Task<RegradeRequestStatusDto?> GetRegradeRequestStatusAsync(Guid studentId, Guid examPaperId);

        Task<List<StudentProgressDto>> GetProgressAsync(Guid studentId);
        Task<StudentErrorSummaryDto> GetErrorSummaryAsync(Guid studentId);
    }
}
