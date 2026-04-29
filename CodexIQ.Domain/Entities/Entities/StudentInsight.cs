using CodexIQ.Domain.Common;

namespace CodexIQ.Domain.Entities
{
    public class StudentInsight : BaseEntity
    {
        public Guid StudentId { get; set; }
        public User Student { get; set; } = null!;

        public string InsightText { get; set; } = string.Empty;
        public bool IsInsightDirty { get; set; } = true;
        public int ExamCountAtLastInsight { get; set; } = 0;
        public DateTime? InsightGeneratedAt { get; set; }
    }
}
