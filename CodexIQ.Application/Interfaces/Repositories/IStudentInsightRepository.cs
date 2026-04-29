using CodexIQ.Domain.Entities;

namespace CodexIQ.Application.Interfaces.Repositories
{
    public interface IStudentInsightRepository
    {
        Task<StudentInsight?> GetByStudentIdAsync(Guid studentId);
    }
}
