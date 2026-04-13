using CodexIQ.Domain.Common;

namespace CodexIQ.Domain.Entities
{
    public class ExtractedCode : BaseEntity
    {
        public Guid ExamPaperId { get; set; }
        public string RawCode { get; set; } = string.Empty;

        
        public ExamPaper ExamPaper { get; set; } = null!;
    }
}