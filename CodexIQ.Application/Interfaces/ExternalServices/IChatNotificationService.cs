public interface IChatNotificationService
{
    Task SendMessageAsync(Guid receiverId, MessageDto message);
    Task SendUnreadCountAsync(Guid receiverId, int count);

    Task SendMessageReadAsync(Guid senderId, Guid messageId);
}