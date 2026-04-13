    
using CodexIQ.Domain.Entities;

public interface IMessageRepository
{
    Task<List<Message>> GetConversationAsync(Guid userId1, Guid userId2);
    Task<Message?> GetByIdAsync(Guid messageId);
    Task AddAsync(Message message);
    Task<int> GetUnreadCountAsync(Guid userId);
    Task<Message?> GetLastMessageAsync(Guid userId1, Guid userId2);
    Task<int> GetUnreadCountBetweenAsync(Guid senderId, Guid receiverId);
    Task<List<User>> GetTeachersForStudentAsync(Guid studentId);
    Task<List<User>> GetStudentsForTeacherAsync(Guid teacherId);
}