public class TeacherCourseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public Guid ClassId { get; set; }
}
