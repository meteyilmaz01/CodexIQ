using CodexIQ.Domain.Entities;
using CodexIQ.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

public class MessageRepository : IMessageRepository
{
    private readonly CodexIQDbContext _context;

    public MessageRepository(CodexIQDbContext context)
    {
        _context = context;
    }

    public async Task<List<Message>> GetConversationAsync(Guid userId1, Guid userId2)
    {
        return await _context.Messages
            .Where(m =>
                (m.SenderId == userId1 && m.ReceiverId == userId2) ||
                (m.SenderId == userId2 && m.ReceiverId == userId1))
            .OrderBy(m => m.CreatedDate)
            .ToListAsync();
    }

    public async Task<Message?> GetByIdAsync(Guid messageId)
    {
        return await _context.Messages.FindAsync(messageId);
    }

    public async Task AddAsync(Message message)
    {
        await _context.Messages.AddAsync(message);
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        return await _context.Messages
            .Where(m => m.ReceiverId == userId && !m.IsRead)
            .CountAsync();
    }
    public async Task<List<User>> GetTeachersForStudentAsync(Guid studentId)
    {
        var teacherIds = await _context.StudentClasses
            .Where(sc => sc.StudentId == studentId)
            .Select(sc => sc.Class.TeacherId)
            .Distinct()
            .ToListAsync();

        return await _context.Users
            .Where(u => teacherIds.Contains(u.Id))
            .ToListAsync();
    }

    public async Task<Message?> GetLastMessageAsync(Guid userId1, Guid userId2)
    {
        return await _context.Messages
            .Where(m =>
                (m.SenderId == userId1 && m.ReceiverId == userId2) ||
                (m.SenderId == userId2 && m.ReceiverId == userId1))
            .OrderByDescending(m => m.CreatedDate)
            .FirstOrDefaultAsync();
    }

    public async Task<int> GetUnreadCountBetweenAsync(Guid senderId, Guid receiverId)
    {
        return await _context.Messages
            .Where(m => m.SenderId == senderId && m.ReceiverId == receiverId && !m.IsRead)
            .CountAsync();
    }

    public async Task<List<User>> GetStudentsForTeacherAsync(Guid teacherId)
    {
        var studentIds = await _context.StudentClasses
            .Where(sc => sc.Class.TeacherId == teacherId)
            .Select(sc => sc.StudentId)
            .Distinct()
            .ToListAsync();

        return await _context.Users
            .Where(u => studentIds.Contains(u.Id))
            .ToListAsync();
    }
}