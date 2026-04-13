using System.ComponentModel.DataAnnotations;

public class CreateClassRequestDto
{
    [Required]
    public string Name { get; set; } = string.Empty;

    [Required]
    public Guid TeacherId { get; set; }
}