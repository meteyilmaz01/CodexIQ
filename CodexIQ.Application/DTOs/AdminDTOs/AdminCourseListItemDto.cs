public class AdminCourseListItemDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid ClassId { get; set; }
    public DateTime CreatedDate { get; set; }
}