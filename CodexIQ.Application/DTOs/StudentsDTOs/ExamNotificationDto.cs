public class ExamNotificationDto
{
    public Guid ExamPaperId { get; set; }
    public string ExamName { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public DateTime EvaluatedAt { get; set; }
    /// <summary>"evaluated" | "overridden"</summary>
    public string Type { get; set; } = "evaluated";
    public int? OriginalScore { get; set; }
    public int? NewScore { get; set; }
}
