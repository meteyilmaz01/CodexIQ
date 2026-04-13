using CodexIQ.Domain.Common;
using CodexIQ.Domain.Enums;

namespace CodexIQ.Domain.Entities
{
    public class ExamPaper : BaseEntity
    {
        public Guid ExamId { get; set; }
        public Guid StudentId { get; set; }
        public string ImagePath { get; set; } = string.Empty;
        public DateTime UploadAt { get; set; } = DateTime.UtcNow;
        public EvaluationStatus Status { get; set; }

        
        public Exam Exam { get; set; } = null!;
        public User Student { get; set; } = null!;

        public ExtractedCode? ExtractedCode { get; set; }
        public ICollection<AIModelResult> AIModelResults { get; set; } = new List<AIModelResult>();
        public FinalEvaluation? FinalEvaluation { get; set; }
    }
}