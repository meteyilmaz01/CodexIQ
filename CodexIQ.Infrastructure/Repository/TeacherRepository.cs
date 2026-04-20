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
                .GroupBy(ep => ep.Exam.Course.Name)
                .Select(g => new
                {
                    CourseName = g.Key,
                    Average = g.Average(ep => ep.FinalEvaluation!.FinalScore),
                    StudentCount = g.Select(ep => ep.StudentId).Distinct().Count()
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

        public async Task<List<ExamPaper>> GetExamPapersForExportAsync(Guid teacherId, Guid examId)
        {
            return await _context.ExamPapers
                .Where(ep => ep.ExamId == examId && ep.Exam.TeacherId == teacherId && ep.FinalEvaluation != null)
                .Include(ep => ep.Student)
                .Include(ep => ep.Exam)
                    .ThenInclude(e => e.Course)
                .Include(ep => ep.FinalEvaluation)
                .OrderByDescending(ep => ep.FinalEvaluation!.FinalScore)
                .ToListAsync();
        }

        public async Task<List<(User Student, string ClassName)>> GetStudentsByTeacherAsync(Guid teacherId, Guid? classId)
        {
            var query = _context.StudentClasses
                .Where(sc => sc.Class.TeacherId == teacherId)
                .Include(sc => sc.Student)
                .Include(sc => sc.Class)
                .AsQueryable();

            if (classId.HasValue)
                query = query.Where(sc => sc.ClassId == classId.Value);

            var studentClasses = await query.ToListAsync();

            return studentClasses
                .Select(sc => (sc.Student, sc.Class.Name))
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
                    StudentCount = c.StudentClasses.Count
                })
                .ToListAsync();
        }
    }
}