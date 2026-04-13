
public class ExamResultListItemDto
{
    public Guid Id { get; set; }
    public string ExamName { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public int Score { get; set; }
    public int SyntaxErrorCount { get; set; }
    public int LogicErrorCount { get; set; }
    public string Status { get; set; } = string.Empty;
}