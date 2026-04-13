public class CreateExamRequestDto
{
    public string Name { get; set; } = string.Empty;
    public Guid CourseId { get; set; }
    public string? CodePurpose { get; set; }
    public string? ProgrammingLanguage { get; set; }
}