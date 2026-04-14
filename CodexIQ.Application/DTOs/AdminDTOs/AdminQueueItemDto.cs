namespace CodexIQ.Application.DTOs.AdminDTOs
{
    public class AdminQueueItemDto
    {
        public string QueueName { get; set; } = string.Empty;
        public int ReadyCount { get; set; }      
        public int UnackedCount { get; set; }    
        public int TotalCount { get; set; }      
        public string Status { get; set; } = string.Empty;
    }
}