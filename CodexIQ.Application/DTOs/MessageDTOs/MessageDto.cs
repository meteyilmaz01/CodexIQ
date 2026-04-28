
public class MessageDto
{
    public Guid Id { get; set; }
    public string From { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public DateTime Time { get; set; }
    public bool IsRead { get; set; }
    public bool IsMine { get; set; }
}
