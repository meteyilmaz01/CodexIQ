using System.ComponentModel.DataAnnotations;

public class CreateAnnouncementRequestDto
{
    [Required]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;
}