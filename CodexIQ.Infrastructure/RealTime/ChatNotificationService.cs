    
using Microsoft.AspNetCore.SignalR;

public class ChatNotificationService : IChatNotificationService
{
    private readonly IHubContext<ChatHub> _hubContext;

    public ChatNotificationService(IHubContext<ChatHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task SendMessageAsync(Guid receiverId, MessageDto message)
    {
        await _hubContext.Clients
            .Group(receiverId.ToString())
            .SendAsync("ReceiveMessage", message);
    }

    public async Task SendUnreadCountAsync(Guid receiverId, int count)
    {
        await _hubContext.Clients
            .Group(receiverId.ToString())
            .SendAsync("UnreadCountUpdated", count);
    }

    public async Task SendMessageReadAsync(Guid senderId, Guid messageId)
    {
        await _hubContext.Clients
            .Group(senderId.ToString())
            .SendAsync("MessageRead", messageId);
    }
}