public class TeacherStudentStatsDto
{
    public Guid StudentId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public double AverageScore { get; set; }
    public int ExamCount { get; set; }
}
