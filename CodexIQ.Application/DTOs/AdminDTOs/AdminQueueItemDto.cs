public class AdminQueueItemDto
{
    public string QueueName { get; set; } = string.Empty;
    public int ApproximateCount { get; set; }
    public string Status { get; set; } = string.Empty;
}