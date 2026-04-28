public class TeacherStudentListItemDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public double Average { get; set; }
    public int ExamCount { get; set; }
}
