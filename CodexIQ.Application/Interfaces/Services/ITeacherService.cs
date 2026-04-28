using Microsoft.AspNetCore.Http;

public interface ITeacherService
{
    // Dashboard
    Task<TeacherStatsDto> GetStatsAsync(Guid teacherId);
    Task<List<RecentUploadDto>> GetRecentUploadsAsync(Guid teacherId);
    Task<List<CourseAverageDto>> GetCourseAveragesAsync(Guid teacherId);
    Task<QueueStatusDto> GetQueueStatusAsync(Guid teacherId);

    // Exam
    Task<CreateExamResponseDto> CreateExamAsync(Guid teacherId, CreateExamRequestDto request);
    Task<UploadPapersResponseDto> UploadPapersAsync(Guid teacherId, Guid examId, List<IFormFile> files);
    Task SaveRubricAsync(Guid teacherId, Guid examId, SaveRubricRequestDto request);
    /// <summary>
    /// Bekleyen kağıtları Extracting durumuna alır.
    /// Her kağıt için kuyruk bilgisi döndürür (controller per-paper komut gönderir).
    /// </summary>
    Task<List<ExamPaperQueueDto>> StartEvaluationAsync(Guid teacherId, Guid examId);

    // Results
    Task<PaginatedResult<TeacherResultListItemDto>> GetResultsAsync(
        Guid teacherId, string? search, string? course, string? exam, string? sortBy, int page, int pageSize);
    Task<TeacherResultDetailDto?> GetResultDetailAsync(Guid teacherId, Guid examPaperId);
    Task OverrideScoreAsync(Guid teacherId, Guid examPaperId, OverrideScoreRequestDto request);
    Task UpdateRubricScoresAsync(Guid teacherId, Guid examPaperId, UpdateRubricScoresDto dto);
    Task UpdateNoteAsync(Guid teacherId, Guid examPaperId, UpdateNoteRequestDto request);
    Task ShareResultAsync(Guid teacherId, Guid examPaperId);
    Task BulkShareAsync(Guid teacherId, BulkShareRequestDto request);
    Task<byte[]> ExportExcelAsync(Guid teacherId, string? examName);
    Task<byte[]> ExportPdfAsync(Guid teacherId, string? examName);

    // Students
    Task<List<TeacherStudentListItemDto>> GetStudentsAsync(Guid teacherId, Guid? classId);
    Task<TeacherStudentStatsDto?> GetStudentStatsAsync(Guid teacherId, Guid studentId);

    // Profile
    Task<TeacherProfileDto> GetProfileAsync(Guid teacherId);
    Task UpdateProfileAsync(Guid teacherId, UpdateTeacherProfileRequestDto request);

    // Courses & Classes
    Task<List<TeacherCourseDto>> GetCoursesAsync(Guid teacherId);
    Task<List<TeacherClassDto>> GetClassesAsync(Guid teacherId);
    Task<string> RegenerateJoinCodeAsync(Guid teacherId, Guid classId);

    // Regrade Requests
    Task<List<TeacherRegradeRequestListItemDto>> GetPendingRegradeRequestsAsync(Guid teacherId);
    Task ResolveRegradeRequestAsync(Guid teacherId, Guid requestId, ResolveRegradeRequestDto dto);
    Task<int> GetPendingRegradeCountAsync(Guid teacherId);

    // Announcements
    Task<List<AdminAnnouncementDto>> GetAnnouncementsAsync();
}