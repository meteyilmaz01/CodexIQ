using CodexIQ.Domain.Common;

namespace CodexIQ.Domain.Entities
{
    public enum RegradeStatus { Pending, Approved, Rejected }

    public class RegradeRequest : BaseEntity
    {
        public Guid ExamPaperId { get; set; }
        public Guid StudentId { get; set; }
        public Guid TeacherId { get; set; }

        public string Reason { get; set; } = string.Empty;
        public RegradeStatus Status { get; set; } = RegradeStatus.Pending;
        public string? TeacherNote { get; set; }
        public DateTime? ResolvedAt { get; set; }

        public ExamPaper ExamPaper { get; set; } = null!;
        public User Student { get; set; } = null!;
        public User Teacher { get; set; } = null!;
    }
}
