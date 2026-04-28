using CodexIQ.Domain.Common;

namespace CodexIQ.Domain.Entities
{
    public class Class : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public Guid TeacherId { get; set; }
        public string JoinCode { get; set; } = string.Empty;


        public User Teacher { get; set; } = null!;
        public ICollection<StudentClass> StudentClasses { get; set; } = new List<StudentClass>();
        public ICollection<Course> Courses { get; set; } = new List<Course>();
    }
}