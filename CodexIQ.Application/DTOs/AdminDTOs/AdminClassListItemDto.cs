public class AdminClassListItemDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public int StudentCount { get; set; }
    public int CourseCount { get; set; }
    public DateTime CreatedDate { get; set; }
    public List<AdminCourseListItemDto> Courses { get; set; } = new();
}   