using CodexIQ.Domain.Common;

namespace CodexIQ.Domain.Entities
{
    public class Announcement : BaseEntity
    {
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public Guid CreatedBy { get; set; }


        public User Creator { get; set; } = null!;
    }
}