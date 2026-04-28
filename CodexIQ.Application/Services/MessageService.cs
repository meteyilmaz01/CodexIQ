using CodexIQ.Application.Interfaces.CoreDataInterfaces;
using CodexIQ.Domain.Entities;

public class MessageService : IMessageService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IChatNotificationService _chatNotification;

    public MessageService(IUnitOfWork unitOfWork, IChatNotificationService chatNotification)
    {
        _unitOfWork = unitOfWork;
        _chatNotification = chatNotification;
    }

    public async Task<List<TeacherListItemDto>> GetTeachersAsync(Guid studentId)
    {
        
        var teachers = await _unitOfWork.Message.GetTeachersForStudentAsync(studentId);

        var result = new List<TeacherListItemDto>();

        foreach (var teacher in teachers)
        {
            var lastMsg = await _unitOfWork.Message.GetLastMessageAsync(studentId, teacher.Id);
            var unread = await _unitOfWork.Message.GetUnreadCountBetweenAsync(teacher.Id, studentId);

            result.Add(new TeacherListItemDto
            {
                Id = teacher.Id,
                FullName = $"{teacher.FirstName} {teacher.LastName}",
                LastMessage = lastMsg?.Content,
                LastMessageTime = lastMsg?.CreatedDate,
                UnreadCount = unread
            });
        }

        return result;
    }

    public async Task<List<MessageDto>> GetConversationAsync(Guid studentId, Guid teacherId)
    {
        var messages = await _unitOfWork.Message.GetConversationAsync(studentId, teacherId);

        return messages.Select(m => new MessageDto
        {
            Id = m.Id,
            From = m.SenderId == studentId ? "me" : "other",
            Text = m.Content,
            Time = m.CreatedDate,
            IsRead = m.IsRead,
            IsMine = m.SenderId == studentId
        }).ToList();
    }

    public async Task SendMessageAsync(Guid senderId, SendMessageRequestDto request)
    {
        var message = new Message
        {
            SenderId = senderId,
            ReceiverId = request.ReceiverId,
            Content = request.Text,
            IsRead = false
        };

        await _unitOfWork.Message.AddAsync(message);
        await _unitOfWork.SaveChangesAsync();

        var messageDto = new MessageDto
        {
            Id = message.Id,
            From = "other",
            Text = message.Content,
            Time = message.CreatedDate,
            IsRead = false,
            IsMine = false
        };

        await _chatNotification.SendMessageAsync(request.ReceiverId, messageDto);

        var unreadCount = await _unitOfWork.Message.GetUnreadCountAsync(request.ReceiverId);
        await _chatNotification.SendUnreadCountAsync(request.ReceiverId, unreadCount);
    }

    public async Task MarkAsReadAsync(Guid userId, Guid messageId)
    {
        var message = await _unitOfWork.Message.GetByIdAsync(messageId);

        if (message != null && message.ReceiverId == userId)
        {
            message.IsRead = true;
            await _unitOfWork.SaveChangesAsync();

            await _chatNotification.SendMessageReadAsync(message.SenderId, messageId);
        }
    }

    public async Task<UnreadCountDto> GetUnreadCountAsync(Guid userId)
    {
        var count = await _unitOfWork.Message.GetUnreadCountAsync(userId);
        return new UnreadCountDto { Count = count };
    }

    public async Task<List<StudentListItemDto>> GetStudentsAsync(Guid teacherId)
    {
        var students = await _unitOfWork.Message.GetStudentsForTeacherAsync(teacherId);

        var result = new List<StudentListItemDto>();

        foreach (var student in students)
        {
            var lastMsg = await _unitOfWork.Message.GetLastMessageAsync(teacherId, student.Id);
            var unread = await _unitOfWork.Message.GetUnreadCountBetweenAsync(student.Id, teacherId);

            result.Add(new StudentListItemDto
            {
                Id = student.Id,
                FullName = $"{student.FirstName} {student.LastName}",
                LastMessage = lastMsg?.Content,
                LastMessageTime = lastMsg?.CreatedDate,
                UnreadCount = unread
            });
        }

        return result;
    }
}