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

        Task<StudentProfileDto> GetProfileAsync(Guid studentId);
        Task UpdateProfileAsync(Guid studentId, UpdateProfileRequestDto request);
    }
}
