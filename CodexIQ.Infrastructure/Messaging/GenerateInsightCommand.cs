using System.Text.Json.Serialization;

namespace CodexIQ.Infrastructure.Messaging
{
    public class GenerateInsightCommand
    {
        [JsonPropertyName("studentId")]
        public Guid StudentId { get; set; }

        [JsonPropertyName("currentInsightText")]
        public string CurrentInsightText { get; set; } = string.Empty;

        [JsonPropertyName("examCountAtLastInsight")]
        public int ExamCountAtLastInsight { get; set; }

        [JsonPropertyName("totalExamCount")]
        public int TotalExamCount { get; set; }

        // Yeni sınavın hataları (delta update için)
        [JsonPropertyName("newExamSyntaxErrors")]
        public List<string> NewExamSyntaxErrors { get; set; } = new();

        [JsonPropertyName("newExamLogicErrors")]
        public List<string> NewExamLogicErrors { get; set; } = new();

        // Full reset tetikleniyorsa tüm geçmiş hatalar
        [JsonPropertyName("allErrors")]
        public List<InsightErrorEntry> AllErrors { get; set; } = new();

        [JsonPropertyName("isFullReset")]
        public bool IsFullReset { get; set; }
    }

    public class InsightErrorEntry
    {
        [JsonPropertyName("examIndex")]
        public int ExamIndex { get; set; }

        [JsonPropertyName("syntaxErrors")]
        public List<string> SyntaxErrors { get; set; } = new();

        [JsonPropertyName("logicErrors")]
        public List<string> LogicErrors { get; set; } = new();
    }
}
