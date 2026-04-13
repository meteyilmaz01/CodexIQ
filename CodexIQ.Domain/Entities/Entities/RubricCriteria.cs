using CodexIQ.Domain.Common;

namespace CodexIQ.Domain.Entities
{
    public class RubricCriteria : BaseEntity
    {
        public Guid ExamId { get; set; }
        public string Criteria { get; set; } = string.Empty;
        public int MaxPoints { get; set; }

        public Exam Exam { get; set; } = null!;
    }
}