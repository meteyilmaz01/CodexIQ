using System.Collections.Generic;

namespace CodexIQ.Application.DTOs.AdminDTOs
{
    public class AdminQueueDto
    {
        public int Pending { get; set; }
        public int Extracting { get; set; }
        public int Evaluating { get; set; }
        public int Completed { get; set; }
        public int Failed { get; set; }
        public int Total { get; set; }
        public List<AdminQueueItemDto> Queues { get; set; } = new();
    }
}