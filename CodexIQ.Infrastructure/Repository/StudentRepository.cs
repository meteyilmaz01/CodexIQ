using CodexIQ.Application.Interfaces.Repositories;
using CodexIQ.Domain.Entities;
using CodexIQ.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace CodexIQ.Infrastructure.Repository
{
    public class StudentRepository : IStudentRepository
    {
        private readonly CodexIQDbContext _context;

        public StudentRepository(CodexIQDbContext context)
        {
            _context = context;
        }

        public async Task<double> GetAverageScoreAsync(Guid studentId)
        {
            var avr = await _context.ExamPapers
                .Where(ep => ep.StudentId == studentId && ep.FinalEvaluation != null)
                .Select(ep => (double?)ep.FinalEvaluation!.FinalScore)
                .AverageAsync();

            return Math.Round(avr ?? 0, 1);
        }

        public async Task<int> GetCodeTestCountAsync(Guid studentId)
        {
            return await _context.ExamPapers
            .Where(ep => ep.StudentId == studentId
                      && ep.ExtractedCode != null)
            .CountAsync();
        }

        public async Task<int?> GetLastExamScoreAsync(Guid studentId)
        {
            var lastPaper = await _context.ExamPapers
            .Where(ep => ep.StudentId == studentId
                      && ep.FinalEvaluation != null)
            .OrderByDescending(ep => ep.FinalEvaluation!.EvaluatedAt)
            .Select(ep => (int?)ep.FinalEvaluation!.FinalScore)
            .FirstOrDefaultAsync();

            return lastPaper;
        }

        public async Task<List<ExamPaper>> GetRecentExamPapersAsync(Guid studentId, int limit)
        {
            return await _context.ExamPapers
             .Where(ep => ep.StudentId == studentId
                       && ep.FinalEvaluation != null)
             .Include(ep => ep.Exam)
                 .ThenInclude(e => e.Course)
             .Include(ep => ep.FinalEvaluation)
             .OrderByDescending(ep => ep.FinalEvaluation!.EvaluatedAt)
             .Take(limit)
             .ToListAsync();
        }

        public async Task<int> GetTotalExamCountAsync(Guid studentId)
        {
            return await _context.ExamPapers
            .Where(ep => ep.StudentId == studentId
                      && ep.FinalEvaluation != null)
            .CountAsync();
        }

        public async Task<Dictionary<string, double>> GetWeakTopicsAsync(Guid studentId)
        {
            var courseAverages = await _context.ExamPapers
            .Where(ep => ep.StudentId == studentId
                      && ep.FinalEvaluation != null)
            .Include(ep => ep.Exam)
                .ThenInclude(e => e.Course)
            .GroupBy(ep => ep.Exam.Course.Name)
            .Select(g => new
            {
                CourseName = g.Key,
                Average = g.Average(ep => ep.FinalEvaluation!.FinalScore)
            })
            .Where(x => x.Average < 75)
            .OrderBy(x => x.Average)
            .Take(5)
            .ToDictionaryAsync(x => x.CourseName, x => Math.Round(x.Average, 1));

            return courseAverages;
        }

        public async Task<(List<ExamPaper> Items, int TotalCount)> GetExamResultsAsync(
         Guid studentId,
         string? search,
         string? course,
         string? sortBy,
         int page,
         int pageSize)
        {
            var query = _context.ExamPapers
                .Where(ep => ep.StudentId == studentId && ep.FinalEvaluation != null)
                .Include(ep => ep.Exam)
                    .ThenInclude(e => e.Course)
                .Include(ep => ep.FinalEvaluation)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.ToLower();
                query = query.Where(ep =>
                    ep.Exam.Name.ToLower().Contains(search));
            }

            if (!string.IsNullOrWhiteSpace(course))
            {
                query = query.Where(ep =>
                    ep.Exam.Course.Name == course);
            }

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

        public async Task<ExamPaper?> GetExamResultDetailAsync(Guid studentId, Guid examPaperId)
        {
            return await _context.ExamPapers
                .Where(ep => ep.Id == examPaperId && ep.StudentId == studentId)
                .Include(ep => ep.Exam)
                    .ThenInclude(e => e.Course)
                .Include(ep => ep.FinalEvaluation)
                .Include(ep => ep.ExtractedCode)
                .Include(ep => ep.AIModelResults)
                .FirstOrDefaultAsync();
        }

        public async Task<Class?> GetClassByJoinCodeAsync(string joinCode)
        {
            return await _context.Classrooms
                .FirstOrDefaultAsync(c => c.JoinCode == joinCode && c.IsActive);
        }

        public async Task<bool> IsStudentInClassAsync(Guid studentId, Guid classId)
        {
            return await _context.Set<StudentClass>()
                .AnyAsync(sc => sc.StudentId == studentId && sc.ClassId == classId);
        }

        public async Task AddStudentToClassAsync(Guid studentId, Guid classId)
        {
            _context.Set<StudentClass>().Add(new StudentClass
            {
                Id = Guid.NewGuid(),
                StudentId = studentId,
                ClassId = classId,
                CreatedDate = DateTime.UtcNow,
                IsActive = true
            });
            await _context.SaveChangesAsync();
        }

        public async Task<RegradeRequest?> GetActiveRegradeRequestAsync(Guid studentId, Guid examPaperId)
        {
            return await _context.RegradeRequests
                .Where(r => r.StudentId == studentId && r.ExamPaperId == examPaperId)
                .OrderByDescending(r => r.CreatedDate)
                .FirstOrDefaultAsync();
        }

        public async Task AddRegradeRequestAsync(RegradeRequest request)
        {
            _context.RegradeRequests.Add(request);
            await _context.SaveChangesAsync();
        }
    }
}
