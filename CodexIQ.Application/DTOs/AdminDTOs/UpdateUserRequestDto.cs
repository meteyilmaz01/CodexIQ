using CodexIQ.Domain.Enums;

namespace CodexIQ.Application.DTOs.AdminDTOs
{
    public class UpdateUserRequestDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public UserRole Role { get; set; }
    }
}