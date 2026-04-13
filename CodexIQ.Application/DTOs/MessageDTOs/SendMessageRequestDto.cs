
public class SendMessageRequestDto
{
    public Guid ReceiverId { get; set; }
    public string Text { get; set; } = string.Empty;
}