namespace CodexIQ.Application.DTOs.StudentsDTOs
{
    public class StudentInsightDto
    {
        public string InsightText { get; set; } = string.Empty;
        public DateTime? GeneratedAt { get; set; }
        public bool IsReady { get; set; }
    }
}
