
public class TeacherResultListItemDto
{
    public Guid Id { get; set; }
    public Guid ExamId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentNo { get; set; } = string.Empty;
    public string ExamName { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public int Score { get; set; }
    public int SyntaxErrorCount { get; set; }
    public int LogicErrorCount { get; set; }
    public bool IsShared { get; set; }
    public bool IsOverridden { get; set; }
}