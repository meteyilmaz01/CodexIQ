using CodexIQ.Domain.Common;

namespace CodexIQ.Domain.Entities
{
    public class AIModelResult : BaseEntity
    {
        public Guid ExamPaperId { get; set; }
        public string ModelName { get; set; } = string.Empty;
        public int Score { get; set; }
        public string Feedback { get; set; } = string.Empty;

        
        public ExamPaper ExamPaper { get; set; } = null!;
    }
}