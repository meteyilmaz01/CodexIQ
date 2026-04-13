public class QueueStatusDto
{
    public int Completed { get; set; }
    public int Processing { get; set; }
    public int Pending { get; set; }
    public int Failed { get; set; }
}