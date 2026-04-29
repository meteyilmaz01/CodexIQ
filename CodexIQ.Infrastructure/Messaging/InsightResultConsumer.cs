using CodexIQ.Domain.Entities;
using CodexIQ.Infrastructure.Persistence;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace CodexIQ.Infrastructure.Messaging
{
    public class InsightResultConsumer : IConsumer<InsightResultPublished>
    {
        private readonly CodexIQDbContext _dbContext;

        public InsightResultConsumer(CodexIQDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task Consume(ConsumeContext<InsightResultPublished> context)
        {
            var message = context.Message;
            Console.WriteLine($"[INSIGHT-CONSUMER] StudentId: {message.StudentId}, Başarılı: {message.Success}");

            if (!message.Success || string.IsNullOrWhiteSpace(message.InsightText))
            {
                Console.WriteLine($"[INSIGHT-CONSUMER][UYARI] Insight üretilemedi, atlanıyor.");
                return;
            }

            var insight = await _dbContext.StudentInsights
                .FirstOrDefaultAsync(s => s.StudentId == message.StudentId);

            if (insight == null)
            {
                insight = new StudentInsight
                {
                    StudentId = message.StudentId,
                    InsightText = message.InsightText,
                    ExamCountAtLastInsight = message.ExamCountAtInsight,
                    IsInsightDirty = false,
                    InsightGeneratedAt = DateTime.UtcNow
                };
                await _dbContext.StudentInsights.AddAsync(insight);
            }
            else
            {
                insight.InsightText = message.InsightText;
                insight.ExamCountAtLastInsight = message.ExamCountAtInsight;
                insight.IsInsightDirty = false;
                insight.InsightGeneratedAt = DateTime.UtcNow;
            }

            await _dbContext.SaveChangesAsync();
            Console.WriteLine($"[INSIGHT-CONSUMER][✅] Insight kaydedildi. StudentId: {message.StudentId}");
        }
    }
}
