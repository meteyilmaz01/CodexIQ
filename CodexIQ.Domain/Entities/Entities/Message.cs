using CodexIQ.Domain.Common;

namespace CodexIQ.Domain.Entities
{
    public class Message : BaseEntity
    {
        public Guid SenderId { get; set; }
        public Guid ReceiverId { get; set; }
        public string Content { get; set; } = string.Empty;
        public bool IsRead { get; set; } = false;


        public User Sender { get; set; } = null!;
        public User Receiver { get; set; } = null!;
    }
}