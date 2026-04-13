
namespace CodexIQ.Infrastructure.Messaging
{
    public record EvaluateExamCommand
    {
        public Guid ExamId { get; init; }
        public Guid TeacherId { get; init; }

    }
}
