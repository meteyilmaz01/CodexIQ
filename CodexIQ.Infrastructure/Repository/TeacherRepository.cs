using CodexIQ.Domain.Entities;
using CodexIQ.Domain.Enums;
using CodexIQ.Application.Interfaces.Repositories;
using CodexIQ.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CodexIQ.Infrastructure.Repository
{
    public class TeacherRepository : ITeacherRepository
    {
        private readonly CodexIQDbContext _context;

        public TeacherRepository(CodexIQDbContext context)
        {
            _context = context;
        }

        public async Task AddExamPapersAsync(List<ExamPaper> papers)
        {
            await _context.ExamPapers.AddRangeAsync(papers);
        }

        public async Task AddRubricAsync(List<RubricCriteria> criterias)
        {
            await _context.RubricCriterias.AddRangeAsync(criterias);
        }

        public async Task<Exam> CreateExamAsync(Exam exam)
        {
            await _context.Exams.AddAsync(exam);
            return exam;
        }

        public async Task DeleteRubricByExamIdAsync(Guid examId)
        {
            var existing = await _context.RubricCriterias.
                Where(r => r.ExamId == examId)
                .ToListAsync();

            _context.RubricCriterias.RemoveRange(existing);
        }

        public async Task<double> GetClassAverageAsync(Guid teacherId)
        {
            var avg = await _context.ExamPapers
                .Where(ep => ep.Exam.TeacherId == teacherId && ep.FinalEvaluation != null)
                .Select(ep => (double?)ep.FinalEvaluation!.FinalScore)
                .AverageAsync();

            return Math.Round(avg ?? 0, 1);
        }

        public async Task<List<(string CourseName, double Average, int StudentCount)>> GetCourseAveragesAsync(Guid teacherId)
        {
            var results = await _context.ExamPapers
                .Where(ep => ep.Exam.TeacherId == teacherId && ep.FinalEvaluation != null)
                .Include(ep => ep.Exam)
                    .ThenInclude(e => e.Course)
                        .ThenInclude(c => c.Class)
                            .ThenInclude(cls => cls.StudentClasses)
                .GroupBy(ep => new
                {
                    CourseName = ep.Exam.Course.Name,
                    ClassStudentCount = ep.Exam.Course.Class.StudentClasses.Count
                })
                .Select(g => new
                {
                    CourseName = g.Key.CourseName,
                    Average = g.Average(ep => ep.FinalEvaluation!.FinalScore),
                    StudentCount = g.Key.ClassStudentCount
                })
                .ToListAsync();

            var tuples = new List<(string CourseName, double Average, int StudentCount)>();
            foreach (var r in results)
            {
                tuples.Add((r.CourseName, Math.Round(r.Average, 1), r.StudentCount));
            }
            return tuples;
        }


        public async Task<int> GetEvaluatedExamCountAsync(Guid teacherId)
        {
            return await _context.ExamPapers
                .Where(ep => ep.Exam.TeacherId == teacherId && ep.FinalEvaluation != null)
                .CountAsync();
        }

        public async Task<Exam?> GetExamByIdAsync(Guid examId, Guid? teacherId = null)
        {
            var query = _context.Exams
                .Include(e => e.ExamPaper)
                    .ThenInclude(ep => ep.FinalEvaluation)
                .Include(e => e.RubricCriterias)
                .Where(e => e.Id == examId)
                .AsQueryable();

            if (teacherId.HasValue && teacherId.Value != Guid.Empty)
            {
                query = query.Where(e => e.TeacherId == teacherId.Value);
            }

            return await query.FirstOrDefaultAsync();
        }

        public async Task<int> GetPendingJobCountAsync(Guid teacherId)
        {
            return await _context.ExamPapers
                .Where(ep => ep.Exam.TeacherId == teacherId && ep.Status == EvaluationStatus.Pending)
                .CountAsync();
        }


        public async Task<List<Exam>> GetRecentExamsAsync(Guid teacherId, int limit)
        {
            return await _context.Exams
                .Where(e => e.TeacherId == teacherId)
                .Include(e => e.ExamPaper)
                .OrderByDescending(e => e.CreatedDate)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<int> GetTotalStudentCountAsync(Guid teacherId)
        {
            var classIds = await _context.Classrooms
            .Where(c => c.TeacherId == teacherId)
            .Select(c => c.Id)
            .ToListAsync();

            return await _context.StudentClasses
                .Where(sc => classIds.Contains(sc.ClassId))
                .Select(sc => sc.StudentId)
                .Distinct()
                .CountAsync();
        }

        public async Task<(int Completed, int Processing, int Pending, int Failed)> GetQueueStatusAsync(Guid teacherId)
        {
            var papers = await _context.ExamPapers
                .Where(ep => ep.Exam.TeacherId == teacherId)
                .Select(ep => ep.Status)
                .ToListAsync();

            return (
                papers.Count(s => s == EvaluationStatus.Completed),
                papers.Count(s => s == EvaluationStatus.Extracting || s == EvaluationStatus.Evaluating),
                papers.Count(s => s == EvaluationStatus.Pending),
                papers.Count(s => s == EvaluationStatus.Failed)
            );
        }

        public async Task<(List<ExamPaper> Items, int TotalCount)> GetResultsAsync(
    Guid teacherId, string? search, string? course, string? exam, string? sortBy, int page, int pageSize)
        {
            var query = _context.ExamPapers
                .Where(ep => ep.Exam.TeacherId == teacherId && ep.FinalEvaluation != null)
                .Include(ep => ep.Exam)
                    .ThenInclude(e => e.Course)
                .Include(ep => ep.Student)
                .Include(ep => ep.FinalEvaluation)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.ToLower();
                // StudentId nullable olabilir — null student'ı aramadan çıkar
                query = query.Where(ep =>
                    (ep.Student != null && ep.Student.FirstName.ToLower().Contains(search)) ||
                    (ep.Student != null && ep.Student.LastName.ToLower().Contains(search)) ||
                    (ep.Student != null && ep.Student.Email.ToLower().Contains(search)));
            }

            if (!string.IsNullOrWhiteSpace(course))
                query = query.Where(ep => ep.Exam.Course.Name == course);

            if (!string.IsNullOrWhiteSpace(exam))
                query = query.Where(ep => ep.Exam.Name == exam);

            var totalCount = await query.CountAsync();

            query = sortBy?.ToLower() switch
            {
                "score" => query.OrderByDescending(ep => ep.FinalEvaluation!.FinalScore),
                "score_asc" => query.OrderBy(ep => ep.FinalEvaluation!.FinalScore),
                "date" => query.OrderByDescending(ep => ep.FinalEvaluation!.EvaluatedAt),
                _ => query.OrderByDescending(ep => ep.FinalEvaluation!.EvaluatedAt)
            };

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        public async Task<ExamPaper?> GetResultDetailAsync(Guid teacherId, Guid examPaperId)
        {
            return await _context.ExamPapers
                .Where(ep => ep.Id == examPaperId && ep.Exam.TeacherId == teacherId)
                .Include(ep => ep.Exam)
                    .ThenInclude(e => e.Course)
                .Include(ep => ep.Exam)
                    .ThenInclude(e => e.RubricCriterias)
                .Include(ep => ep.Student)
                .Include(ep => ep.FinalEvaluation)
                .Include(ep => ep.ExtractedCode)
                .Include(ep => ep.AIModelResults)
                .FirstOrDefaultAsync();
        }

        public async Task<List<ExamPaper>> GetExamPapersByIdsAsync(Guid teacherId, List<Guid> ids)
        {
            return await _context.ExamPapers
                .Where(ep => ids.Contains(ep.Id) && ep.Exam.TeacherId == teacherId)
                .Include(ep => ep.FinalEvaluation)
                .ToListAsync();
        }

        public async Task<List<ExamPaper>> GetExamPapersForExportAsync(Guid teacherId, string? examName)
        {
            return await _context.ExamPapers
                .Where(ep => ep.Exam.TeacherId == teacherId
                          && ep.FinalEvaluation != null
                          && (string.IsNullOrEmpty(examName) || ep.Exam.Name == examName))
                .Include(ep => ep.Student)
                .Include(ep => ep.Exam)
                    .ThenInclude(e => e.Course)
                .Include(ep => ep.FinalEvaluation)
                .OrderByDescending(ep => ep.FinalEvaluation!.FinalScore)
                .ToListAsync();
        }

        public async Task<List<(User Student, string ClassName, double Average, int ExamCount)>> GetStudentsByTeacherAsync(Guid teacherId, Guid? classId)
        {
            var query = _context.StudentClasses
                .Where(sc => sc.Class.TeacherId == teacherId)
                .Include(sc => sc.Student)
                .Include(sc => sc.Class)
                .AsQueryable();

            if (classId.HasValue)
                query = query.Where(sc => sc.ClassId == classId.Value);

            var studentClasses = await query.ToListAsync();
            var studentIds = studentClasses.Select(sc => sc.StudentId).Distinct().ToList();

            var stats = await _context.ExamPapers
                .Where(ep => ep.StudentId != null
                          && studentIds.Contains(ep.StudentId.Value)
                          && ep.Exam.TeacherId == teacherId
                          && ep.FinalEvaluation != null)
                .GroupBy(ep => ep.StudentId!.Value)
                .Select(g => new
                {
                    StudentId = g.Key,
                    ExamCount = g.Count(),
                    Average = g.Average(ep => ep.FinalEvaluation!.FinalScore)
                })
                .ToDictionaryAsync(x => x.StudentId, x => (x.Average, x.ExamCount));

            return studentClasses
                .Select(sc =>
                {
                    var s = stats.TryGetValue(sc.StudentId, out var v) ? v : (0d, 0);
                    return (sc.Student, sc.Class.Name, Math.Round(s.Item1, 1), s.Item2);
                })
                .ToList();
        }

        public async Task<(User Student, double AverageScore, int ExamCount)?> GetStudentStatsAsync(Guid teacherId, Guid studentId)
        {
            var isTeacherStudent = await _context.StudentClasses
                .AnyAsync(sc => sc.StudentId == studentId && sc.Class.TeacherId == teacherId);

            if (!isTeacherStudent) return null;

            var student = await _context.Users.FindAsync(studentId);
            if (student == null) return null;

            var papers = await _context.ExamPapers
                .Where(ep => ep.StudentId == studentId && ep.Exam.TeacherId == teacherId && ep.FinalEvaluation != null)
                .Include(ep => ep.FinalEvaluation)
                .ToListAsync();

            var examCount = papers.Count;
            var averageScore = examCount > 0
                ? Math.Round(papers.Average(p => p.FinalEvaluation!.FinalScore), 1)
                : 0;

            return (student, averageScore, examCount);
        }

        public async Task<List<TeacherCourseDto>> GetCoursesByTeacherIdAsync(Guid teacherId)
        {
            return await _context.Courses
                .Include(c => c.Class)
                .Where(c => c.Class.TeacherId == teacherId && c.IsActive)
                .OrderBy(c => c.Name)
                .Select(c => new TeacherCourseDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    ClassName = c.Class.Name,
                    ClassId = c.ClassId
                })
                .ToListAsync();
        }

        public async Task<List<TeacherClassDto>> GetClassesByTeacherIdAsync(Guid teacherId)
        {
            return await _context.Classrooms
                .Where(c => c.TeacherId == teacherId && c.IsActive)
                .OrderBy(c => c.Name)
                .Select(c => new TeacherClassDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    StudentCount = c.StudentClasses.Count,
                    JoinCode = c.JoinCode
                })
                .ToListAsync();
        }

        public async Task<Class?> GetClassByIdAsync(Guid classId, Guid teacherId)
        {
            return await _context.Classrooms
                .FirstOrDefaultAsync(c => c.Id == classId && c.TeacherId == teacherId && c.IsActive);
        }

        public async Task UpdateClassJoinCodeAsync(Guid classId, string newCode)
        {
            var cls = await _context.Classrooms.FindAsync(classId);
            if (cls != null)
            {
                cls.JoinCode = newCode;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<RegradeRequest>> GetPendingRegradeRequestsAsync(Guid teacherId)
        {
            return await _context.RegradeRequests
                .Where(r => r.TeacherId == teacherId && r.Status == RegradeStatus.Pending)
                .Include(r => r.Student)
                .Include(r => r.ExamPaper)
                    .ThenInclude(ep => ep.Exam)
                        .ThenInclude(e => e.Course)
                .Include(r => r.ExamPaper)
                    .ThenInclude(ep => ep.FinalEvaluation)
                .OrderBy(r => r.CreatedDate)
                .ToListAsync();
        }

        public async Task<RegradeRequest?> GetRegradeRequestByIdAsync(Guid requestId, Guid teacherId)
        {
            return await _context.RegradeRequests
                .Include(r => r.ExamPaper)
                    .ThenInclude(ep => ep.FinalEvaluation)
                .FirstOrDefaultAsync(r => r.Id == requestId && r.TeacherId == teacherId);
        }

        public async Task UpdateRegradeRequestAsync(RegradeRequest request)
        {
            _context.RegradeRequests.Update(request);
            await _context.SaveChangesAsync();
        }

        public async Task<int> GetPendingRegradeCountAsync(Guid teacherId)
        {
            return await _context.RegradeRequests
                .CountAsync(r => r.TeacherId == teacherId && r.Status == RegradeStatus.Pending);
        }

        public async Task<List<AIModelResult>> GetExamModelResultsAsync(Guid examId, Guid teacherId)
        {
            return await _context.AIModelResults
                .Where(r => r.ExamPaper.ExamId == examId
                         && r.ExamPaper.Exam.TeacherId == teacherId
                         && r.ExamPaper.FinalEvaluation != null)
                .Include(r => r.ExamPaper)
                .ToListAsync();
        }

        public async Task<List<TopExamErrorDto>> GetTopExamErrorsAsync(Guid examId, Guid teacherId)
        {
            var evaluations = await _context.FinalEvaluations
                .Where(fe => fe.ExamPaper.ExamId == examId
                          && fe.ExamPaper.Exam.TeacherId == teacherId)
                .ToListAsync();

            var errors = new List<(string Description, string Type)>();

            foreach (var fe in evaluations)
            {
                ExtractErrors(fe.SyntaxErrorsJson, "Syntax", errors);
                ExtractErrors(fe.LogicErrorsJson, "Logic", errors);
            }

            return errors
                .GroupBy(e => (e.Description, e.Type))
                .Select(g => new TopExamErrorDto
                {
                    Description = g.Key.Description,
                    Type        = g.Key.Type,
                    Count       = g.Count()
                })
                .OrderByDescending(e => e.Count)
                .Take(3)
                .ToList();
        }

        public async Task<List<Exam>> GetAllExamsAsync(Guid teacherId)
        {
            return await _context.Exams
                .Where(e => e.TeacherId == teacherId && e.IsActive)
                .Include(e => e.Course)
                .Include(e => e.ExamPaper.Where(p => p.FinalEvaluation != null))
                .OrderByDescending(e => e.CreatedDate)
                .ToListAsync();
        }

        private static void ExtractErrors(string? json, string type, List<(string, string)> list)
        {
            if (string.IsNullOrEmpty(json)) return;
            try
            {
                using var doc = System.Text.Json.JsonDocument.Parse(json);
                foreach (var el in doc.RootElement.EnumerateArray())
                {
                    string desc = el.TryGetProperty("Description", out var p) ? p.GetString() ?? "" :
                                  el.TryGetProperty("description", out var d) ? d.GetString() ?? "" :
                                  el.TryGetProperty("aciklama", out var a) ? a.GetString() ?? "" : "";
                    if (!string.IsNullOrEmpty(desc))
                        list.Add((desc, type));
                }
            }
            catch { }
        }

        public async Task<Exam?> GetExamWithPapersAsync(Guid examId, Guid teacherId)
        {
            return await _context.Exams
                .Include(e => e.ExamPaper)
                    .ThenInclude(ep => ep.FinalEvaluation)
                .Include(e => e.ExamPaper)
                    .ThenInclude(ep => ep.AIModelResults)
                .Include(e => e.ExamPaper)
                    .ThenInclude(ep => ep.ExtractedCode)
                .Include(e => e.RubricCriterias)
                .FirstOrDefaultAsync(e => e.Id == examId && e.TeacherId == teacherId);
        }

        public async Task DeleteExamAsync(Exam exam)
        {
            _context.Exams.Remove(exam);
        }

        public async Task<ExamPaper?> GetExamPaperByIdAsync(Guid examPaperId, Guid teacherId)
        {
            return await _context.ExamPapers
                .Include(ep => ep.FinalEvaluation)
                .Include(ep => ep.AIModelResults)
                .Include(ep => ep.ExtractedCode)
                .Include(ep => ep.Exam)
                .FirstOrDefaultAsync(ep => ep.Id == examPaperId && ep.Exam.TeacherId == teacherId);
        }

        public async Task DeleteExamPaperAsync(ExamPaper paper)
        {
            _context.ExamPapers.Remove(paper);
        }
    }
}