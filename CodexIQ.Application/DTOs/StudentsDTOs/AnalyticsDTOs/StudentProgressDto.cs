public class StudentProgressDto
{
    public string ExamName { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public int Score { get; set; }
    public int MaxScore { get; set; }
}
