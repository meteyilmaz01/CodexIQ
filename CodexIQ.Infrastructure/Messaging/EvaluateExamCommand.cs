
namespace CodexIQ.Infrastructure.Messaging
{
    public record EvaluateExamCommand
    {
        public Guid ExamId { get; init; }
        public Guid TeacherId { get; init; }


        public Guid ExamPaperId { get; init; }
        public string ImagePath { get; init; } = string.Empty;

  
        public string TeacherContext { get; init; } = string.Empty;
        public string ProgrammingLanguage { get; init; } = "unknown";
    }
}
