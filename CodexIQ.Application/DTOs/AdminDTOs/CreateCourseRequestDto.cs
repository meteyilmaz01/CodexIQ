using System.ComponentModel.DataAnnotations;

public class CreateCourseRequestDto
{
    [Required]
    public string Name { get; set; } = string.Empty;

    [Required]
    public Guid ClassId { get; set; }
}