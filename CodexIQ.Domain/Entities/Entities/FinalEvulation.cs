using CodexIQ.Domain.Common;

namespace CodexIQ.Domain.Entities
{
    public class FinalEvaluation : BaseEntity
    {
        public Guid ExamPaperId { get; set; }
        public int FinalScore { get; set; }

        public int OriginalScore { get; set; }        
        public bool IsOverridden { get; set; }         
        public bool IsShared { get; set; }

        public string FinalFeedback { get; set; } = string.Empty;
        public int SyntaxErrorCount { get; set; }
        public int LogicErrorCount { get; set; }
        public string? SyntaxErrorsJson { get; set; }   
        public string? LogicErrorsJson { get; set; }    
        public string? TeacherNote { get; set; }
        public string? RubricScoresJson { get; set; }
        public DateTime EvaluatedAt { get; set; } = DateTime.UtcNow;

        public ExamPaper ExamPaper { get; set; } = null!;
    }
}