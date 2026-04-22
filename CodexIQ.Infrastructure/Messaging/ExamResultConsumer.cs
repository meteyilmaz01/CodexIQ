using CodexIQ.Application.Interfaces.CoreDataInterfaces;
using CodexIQ.Domain.Entities;
using CodexIQ.Domain.Enums;
using CodexIQ.Infrastructure.Persistence;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

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
            Console.WriteLine($"\n[CONSUMER] ═══════════════════════════════════════");
            Console.WriteLine($"[CONSUMER] Yeni sonuç mesajı alındı");
            Console.WriteLine($"[CONSUMER] ExamPaperId: {message.ExamPaperId}");
            Console.WriteLine($"[CONSUMER] ExamId:      {message.ExamId}");
            Console.WriteLine($"[CONSUMER] Status:      {message.Status}");
            Console.WriteLine($"[CONSUMER] ═══════════════════════════════════════");

            var paper = await _dbContext.ExamPapers
                .Include(p => p.ExtractedCode)
                .Include(p => p.AIModelResults)
                .Include(p => p.FinalEvaluation)
                .FirstOrDefaultAsync(p => p.Id == message.ExamPaperId);

            if (paper == null)
            {
                Console.WriteLine($"[CONSUMER][HATA] ExamPaper bulunamadı: {message.ExamPaperId}");
                return;
            }

            bool isFailed = message.Status == "failed";

            if (!string.IsNullOrWhiteSpace(message.ExtractedCode))
            {
                if (paper.ExtractedCode == null)
                {
                    var extractedCode = new ExtractedCode
                    {
                        ExamPaperId = paper.Id,
                        RawCode = message.ExtractedCode
                    };
                    await _dbContext.ExtractedCodes.AddAsync(extractedCode);
                    Console.WriteLine($"[CONSUMER] ExtractedCode oluşturuldu ({message.ExtractedCode.Length} karakter)");
                }
                else
                {
                    paper.ExtractedCode.RawCode = message.ExtractedCode;
                    Console.WriteLine($"[CONSUMER] ExtractedCode güncellendi ({message.ExtractedCode.Length} karakter)");
                }
            }

            if (message.ModelScores != null && !isFailed)
            {
                var modelScoreMap = new Dictionary<string, int>
                {
                    { "Gemini 2.5 Flash", message.ModelScores.Gemini },
                    { "Groq Llama 3.3",   message.ModelScores.GroqLlama },
                    { "Ollama Llama 3.1", message.ModelScores.OllamaLlama }
                };

                if (paper.AIModelResults.Any())
                {
                    _dbContext.AIModelResults.RemoveRange(paper.AIModelResults);
                }

                foreach (var (modelName, score) in modelScoreMap)
                {
                    await _dbContext.AIModelResults.AddAsync(new AIModelResult
                    {
                        ExamPaperId = paper.Id,
                        ModelName = modelName,
                        Score = score,
                        Feedback = $"{modelName}: {score}/100"
                    });
                }
                Console.WriteLine($"[CONSUMER] Model skorları kaydedildi: Gemini={message.ModelScores.Gemini}, Groq={message.ModelScores.GroqLlama}, Ollama={message.ModelScores.OllamaLlama}");
            }

            var eval = message.Evaluation;
            int finalScore = isFailed ? 0 : (eval?.ToplamPuan ?? 0);

   
            var syntaxErrorsJson = SerializeErrors(eval?.SyntaxHatalari ?? new List<HataDetayiMessage>());
            var logicErrorsJson  = SerializeErrors(eval?.MantikHatalari ?? new List<HataDetayiMessage>());

       
            var feedback = isFailed
                ? (eval?.HakemOzeti ?? "Değerlendirme başarısız")
                : $"{eval?.HakemOzeti ?? ""}\n\n{eval?.GenelDegerlendirme ?? ""}".Trim();

            if (paper.FinalEvaluation == null)
            {
                var finalEvaluation = new FinalEvaluation
                {
                    ExamPaperId      = paper.Id,
                    FinalScore       = finalScore,
                    OriginalScore    = finalScore,
                    FinalFeedback    = feedback,
                    SyntaxErrorCount = eval?.SyntaxHatalari?.Count ?? 0,
                    LogicErrorCount  = eval?.MantikHatalari?.Count ?? 0,
                    SyntaxErrorsJson = syntaxErrorsJson,
                    LogicErrorsJson  = logicErrorsJson,
                    IsOverridden     = false,
                    IsShared         = false,
                    EvaluatedAt      = DateTime.UtcNow
                };

                await _dbContext.FinalEvaluations.AddAsync(finalEvaluation);
                Console.WriteLine($"[CONSUMER] FinalEvaluation oluşturuldu: {finalScore}/100");
            }
            else
            {
          
                if (!paper.FinalEvaluation.IsOverridden)
                {
                    paper.FinalEvaluation.FinalScore    = finalScore;
                    paper.FinalEvaluation.OriginalScore = finalScore;
                }
                paper.FinalEvaluation.FinalFeedback    = feedback;
                paper.FinalEvaluation.SyntaxErrorCount = eval?.SyntaxHatalari?.Count ?? 0;
                paper.FinalEvaluation.LogicErrorCount  = eval?.MantikHatalari?.Count ?? 0;
                paper.FinalEvaluation.SyntaxErrorsJson = syntaxErrorsJson;
                paper.FinalEvaluation.LogicErrorsJson  = logicErrorsJson;
                paper.FinalEvaluation.EvaluatedAt      = DateTime.UtcNow;
                Console.WriteLine($"[CONSUMER] FinalEvaluation güncellendi: {finalScore}/100");
            }

        
            if (paper.StudentId == null && message.StudentInfo != null)
            {
                User? matchedStudent = null;

        
                if (!string.IsNullOrWhiteSpace(message.StudentInfo.StudentNumber))
                {
                    var studentNumber = message.StudentInfo.StudentNumber.Trim();
                    matchedStudent = await _dbContext.Users
                        .Where(u => u.StudentNumber == studentNumber)
                        .FirstOrDefaultAsync();

                    if (matchedStudent != null)
                        Console.WriteLine($"[CONSUMER] Öğrenci numarasıyla eşleştirildi: {studentNumber} → {matchedStudent.Id}");
                }

        
                if (matchedStudent == null
                    && !string.IsNullOrWhiteSpace(message.StudentInfo.FirstName)
                    && !string.IsNullOrWhiteSpace(message.StudentInfo.LastName))
                {
                    var firstName = message.StudentInfo.FirstName.Trim();
                    var lastName  = message.StudentInfo.LastName.Trim();

                    matchedStudent = await _dbContext.Users
                        .Where(u => u.FirstName.ToLower() == firstName.ToLower()
                                 && u.LastName.ToLower()  == lastName.ToLower())
                        .FirstOrDefaultAsync();

                    if (matchedStudent != null)
                        Console.WriteLine($"[CONSUMER] İsimle eşleştirildi: {firstName} {lastName} → {matchedStudent.Id}");
                    else
                        Console.WriteLine($"[CONSUMER][UYARI] Öğrenci bulunamadı: '{firstName} {lastName}' — StudentId null kalıyor");
                }

                if (matchedStudent != null)
                    paper.StudentId = matchedStudent.Id;
            }

      
            paper.Status = isFailed ? EvaluationStatus.Failed : EvaluationStatus.Completed;

     
            try
            {
                await _unitOfWork.SaveChangesAsync();
                Console.WriteLine($"[CONSUMER][✅] ExamPaper {message.ExamPaperId} başarıyla kaydedildi. Puan: {finalScore}/100");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CONSUMER][KRİTİK HATA] Kaydetme hatası: {ex.Message}");
                throw;
            }
        }

        
        private static string SerializeErrors(List<HataDetayiMessage> hatalar)
        {
            if (hatalar == null || !hatalar.Any())
                return "[]";

            var errors = hatalar.Select(h => new
            {
                Line        = TryParseLineNumber(h.Satir),
                Description = h.Aciklama,
                Severity    = h.Severity,
                Hint        = h.Hint
            }).ToList();

            return JsonSerializer.Serialize(errors);
        }

        private static int TryParseLineNumber(string satir)
        {
            if (string.IsNullOrWhiteSpace(satir)) return 0;
            var digits = new string(satir.Where(char.IsDigit).ToArray());
            return int.TryParse(digits, out var n) ? n : 0;
        }
    }
}
