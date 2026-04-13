public interface IMessageService
{
    Task<List<TeacherListItemDto>> GetTeachersAsync(Guid studentId);
    Task<List<MessageDto>> GetConversationAsync(Guid studentId, Guid teacherId);
    Task SendMessageAsync(Guid senderId, SendMessageRequestDto request);
    Task MarkAsReadAsync(Guid userId, Guid messageId);
    Task<UnreadCountDto> GetUnreadCountAsync(Guid userId);
    Task<List<StudentListItemDto>> GetStudentsAsync(Guid teacherId);
}