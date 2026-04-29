using CodexIQ.Application.Interfaces.Repositories;
using CodexIQ.Domain.Entities;
using CodexIQ.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CodexIQ.Infrastructure.Repository
{
    public class StudentInsightRepository : IStudentInsightRepository
    {
        private readonly CodexIQDbContext _context;

        public StudentInsightRepository(CodexIQDbContext context)
        {
            _context = context;
        }

        public async Task<StudentInsight?> GetByStudentIdAsync(Guid studentId)
        {
            return await _context.StudentInsights
                .FirstOrDefaultAsync(s => s.StudentId == studentId);
        }
    }
}
