
namespace CodexIQ.Infrastructure.Messaging
{
    /// <summary>
    /// Python worker'a tek bir sınav kağıdı için gönderilen komut.
    /// StartEvaluation endpoint'i her ExamPaper için ayrı bir komut gönderir.
    /// </summary>
    public record EvaluateExamCommand
    {
        public Guid ExamId { get; init; }
        public Guid TeacherId { get; init; }

        // Kağıt bazlı alanlar
        public Guid ExamPaperId { get; init; }
        public string ImagePath { get; init; } = string.Empty;

        // Python worker'ın değerlendirme için kullandığı bağlam
        public string TeacherContext { get; init; } = string.Empty;
        public string ProgrammingLanguage { get; init; } = "unknown";
    }
}
