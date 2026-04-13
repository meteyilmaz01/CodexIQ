using CodexIQ.Application.Interfaces.CoreDataInterfaces;
using CodexIQ.Domain.Entities;
using CodexIQ.Domain.Enums;
using CodexIQ.Infrastructure.Persistence;
using MassTransit;

namespace CodexIQ.Infrastructure.Messaging
{
    public class ExamResultConsumer : IConsumer<ExamResultPublished>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly CodexIQDbContext _dbContext;

        public ExamResultConsumer(IUnitOfWork unitOfWork, CodexIQDbContext dbContext)
        {
            _unitOfWork = unitOfWork;
            _dbContext = dbContext;
        }

        public async Task Consume(ConsumeContext<ExamResultPublished> context)
        {
            var message = context.Message;
            Console.WriteLine($"[ADIM 1] Kuyruktan mesaj geldi. ExamId: {message.ExamId}");

            var exam = await _unitOfWork.Teacher.GetExamByIdAsync(message.ExamId);

            if (exam == null)
            {
                Console.WriteLine("[HATA] Veritabanında bu ID ile bir sınav BULUNAMADI.");
                return;
            }

            Console.WriteLine($"[ADIM 2] Sınav bulundu: {exam.Name}");

            if (exam.ExamPaper == null || !exam.ExamPaper.Any())
            {
                Console.WriteLine("[HATA] Sınava ait hiçbir kağıt (ExamPaper) bulunamadı. Güncelleme yapılamıyor.");
                return;
            }

            Console.WriteLine($"[ADIM 3] {exam.ExamPaper.Count} adet kağıt işleniyor...");

            foreach (var paper in exam.ExamPaper)
            {
                paper.Status = EvaluationStatus.Completed;

                if (paper.FinalEvaluation == null)
                {
                    var finalEvaluation = new FinalEvaluation
                    {
                        ExamPaperId = paper.Id,
                        FinalScore = 85,
                        OriginalScore = 85,
                        EvaluatedAt = DateTime.UtcNow
                    };

                    paper.FinalEvaluation = finalEvaluation;
                    await _dbContext.FinalEvaluations.AddAsync(finalEvaluation);
                    continue;
                }

                paper.FinalEvaluation.FinalScore = 85;
                paper.FinalEvaluation.OriginalScore = 85;
                paper.FinalEvaluation.EvaluatedAt = DateTime.UtcNow;
            }

            try
            {
                await _unitOfWork.SaveChangesAsync();
                Console.WriteLine($"[BAŞARI] Sınav {message.ExamId} başarıyla güncellendi ve kaydedildi.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[KRİTİK HATA] Kaydetme sırasında hata: {ex.Message}");
            }
        }
    }
}
