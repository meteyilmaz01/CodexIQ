using CodexIQ.Domain.Common;

namespace CodexIQ.Domain.Entities
{
    public class StudentClass : BaseEntity
    {
        public Guid ClassId { get; set; }
        public Guid StudentId { get; set; }

        public Class Class { get; set; } = null!;
        public User Student { get; set; } = null!;
    }
}