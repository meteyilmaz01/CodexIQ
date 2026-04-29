using System.Text.Json.Serialization;

namespace CodexIQ.Infrastructure.Messaging
{
    public class InsightResultPublished
    {
        [JsonPropertyName("studentId")]
        public Guid StudentId { get; set; }

        [JsonPropertyName("insightText")]
        public string InsightText { get; set; } = string.Empty;

        [JsonPropertyName("examCountAtInsight")]
        public int ExamCountAtInsight { get; set; }

        [JsonPropertyName("success")]
        public bool Success { get; set; }
    }
}
