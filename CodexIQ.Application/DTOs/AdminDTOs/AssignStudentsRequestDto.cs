using System.ComponentModel.DataAnnotations;

public class AssignStudentsRequestDto
{
    [Required]
    public List<Guid> StudentIds { get; set; } = new();
}
