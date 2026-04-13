using CodexIQ.Domain.Common;

namespace CodexIQ.Domain.Entities
{
    public class Exam : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public Guid CourseId { get; set; }
        public Guid TeacherId { get; set; }
        public bool IsPublished { get; set; } = false;
        public string? CodePurpose { get; set; }         
        public string? ProgrammingLanguage { get; set; }

        public Course Course { get; set; } = null!;
        public User Teacher { get; set; } = null!;
        public ICollection<ExamPaper> ExamPaper { get; set; } = new List<ExamPaper>();
        public ICollection<RubricCriteria> RubricCriterias { get; set; } = new List<RubricCriteria>();
    }
}