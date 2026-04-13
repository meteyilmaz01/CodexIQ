using CodexIQ.Domain.Common;

namespace CodexIQ.Domain.Entities
{
    public class Course : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public Guid ClassId { get; set; }

       
        public Class Class { get; set; } = null!;
        public ICollection<Exam> Exams { get; set; } = new List<Exam>();
    }
}