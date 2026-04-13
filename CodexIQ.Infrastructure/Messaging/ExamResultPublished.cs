using System;

namespace CodexIQ.Infrastructure.Messaging
{
    public record ExamResultPublished(Guid ExamId, Guid TeacherId, string ResultJson);
}