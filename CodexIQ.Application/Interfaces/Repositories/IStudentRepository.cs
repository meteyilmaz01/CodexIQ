using CodexIQ.Application.Interfaces.CoreDataInterfaces;
using CodexIQ.Domain.Entities;
using FluentValidation.Validators;
using System;
using System.Collections.Generic;
using System.Text;

namespace CodexIQ.Application.Interfaces.Repositories
{
    public interface IStudentRepository
    {
        Task<double> GetAverageScoreAsync(Guid studentId);
        Task<int?> GetLastExamScoreAsync(Guid studentId);
        Task<int> GetTotalExamCountAsync(Guid studentId);
        Task<int> GetCodeTestCountAsync(Guid studentId);
        Task<List<ExamPaper>> GetRecentExamPapersAsync(Guid studentId, int limit);
        Task<Dictionary<string, double>> GetWeakTopicsAsync(Guid studentId);

        Task<(List<ExamPaper> Items, int TotalCount)> GetExamResultsAsync(
            Guid studentId,
            string? search,
            string? course,
            string? sortBy,
            int page,
            int pageSize);

        Task<ExamPaper?> GetExamResultDetailAsync(Guid studentId, Guid examPaperId);

        Task<Class?> GetClassByJoinCodeAsync(string joinCode);
        Task<bool> IsStudentInClassAsync(Guid studentId, Guid classId);
        Task AddStudentToClassAsync(Guid studentId, Guid classId);

        Task<RegradeRequest?> GetActiveRegradeRequestAsync(Guid studentId, Guid examPaperId);
        Task AddRegradeRequestAsync(RegradeRequest request);

        Task<List<ExamPaper>> GetProgressPapersAsync(Guid studentId);
        Task<List<FinalEvaluation>> GetAllFinalEvaluationsAsync(Guid studentId);
    }
}
