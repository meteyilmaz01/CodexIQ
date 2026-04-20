using CodexIQ.Domain.Common;
using CodexIQ.Domain.Enums;

namespace CodexIQ.Domain.Entities
{
    public class User : BaseEntity
    {
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? StudentNumber { get; set; }
        public UserRole Role { get; set; }

        
        public ICollection<StudentClass> StudentClasses { get; set; } = new List<StudentClass>();
        public ICollection<Class> TaughtClasses { get; set; } = new List<Class>();
        public ICollection<Message> SentMessages { get; set; } = new List<Message>();
        public ICollection<Message> ReceivedMessages { get; set; } = new List<Message>();
        public ICollection<ExamPaper> ExamPapers { get; set; } = new List<ExamPaper>();
    }
}