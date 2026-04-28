
using CodexIQ.Domain.Entities;

public interface ITeacherRepository
{
    // Dashboard
    Task<int> GetTotalStudentCountAsync(Guid teacherId);
    Task<int> GetEvaluatedExamCountAsync(Guid teacherId);
    Task<int> GetPendingJobCountAsync(Guid teacherId);
    Task<double> GetClassAverageAsync(Guid teacherId);
    Task<List<Exam>> GetRecentExamsAsync(Guid teacherId, int limit);
    Task<List<(string CourseName, double Average, int StudentCount)>> GetCourseAveragesAsync(Guid teacherId);
    Task<(int Completed, int Processing, int Pending, int Failed)> GetQueueStatusAsync(Guid teacherId);

    // Exam
    Task<Exam> CreateExamAsync(Exam exam);
    Task<Exam?> GetExamByIdAsync(Guid examId, Guid? teacherId = null);
    Task AddExamPapersAsync(List<ExamPaper> papers);
    Task AddRubricAsync(List<RubricCriteria> criterias);
    Task DeleteRubricByExamIdAsync(Guid examId);

    // Resultes
    Task<(List<ExamPaper> Items, int TotalCount)> GetResultsAsync(
        Guid teacherId, string? search, string? course, string? exam, string? sortBy, int page, int pageSize);
    Task<ExamPaper?> GetResultDetailAsync(Guid teacherId, Guid examPaperId);
    Task<List<ExamPaper>> GetExamPapersByIdsAsync(Guid teacherId, List<Guid> ids);
    Task<List<ExamPaper>> GetExamPapersForExportAsync(Guid teacherId, Guid examId);

    // Students
    Task<List<(User Student, string ClassName, double Average, int ExamCount)>> GetStudentsByTeacherAsync(Guid teacherId, Guid? classId);
    Task<(User Student, double AverageScore, int ExamCount)?> GetStudentStatsAsync(Guid teacherId, Guid studentId);

    // Courses & Classes
    Task<List<TeacherCourseDto>> GetCoursesByTeacherIdAsync(Guid teacherId);
    Task<List<TeacherClassDto>> GetClassesByTeacherIdAsync(Guid teacherId);
}
