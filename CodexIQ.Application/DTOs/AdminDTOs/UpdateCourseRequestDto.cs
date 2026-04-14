namespace CodexIQ.Application.DTOs.AdminDTOs
{
    public class UpdateCourseRequestDto
    {
        public string Name { get; set; } = string.Empty;
        public Guid ClassId { get; set; }
    }
}