public class TeacherRegradeRequestListItemDto
{
    public Guid Id { get; set; }
    public Guid ExamPaperId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string ExamName { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public int CurrentScore { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTime CreatedDate { get; set; }
}

public class ResolveRegradeRequestDto
{
    /// <summary>"Approved" | "Rejected"</summary>
    public string Decision { get; set; } = string.Empty;
    public string? TeacherNote { get; set; }
    /// <summary>Yalnızca Approved ve yeni puan girilmek istendiğinde dolu gelir.</summary>
    public int? NewScore { get; set; }
}
