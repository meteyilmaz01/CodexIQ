namespace CodexIQ.Application.DTOs.AdminDTOs
{
    public class UpdateClassRequestDto
    {
        public string Name { get; set; } = string.Empty;
        public Guid TeacherId { get; set; }
    }
}