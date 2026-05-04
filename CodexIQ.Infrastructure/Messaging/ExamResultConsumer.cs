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
        private readonly ISendEndpointProvider _sendEndpointProvider;

        public ExamResultConsumer(IUnitOfWork unitOfWork, CodexIQDbContext dbContext, ISendEndpointProvider sendEndpointProvider)
        {
            _unitOfWork = unitOfWork;
            _dbContext = dbContext;
            _sendEndpointProvider = sendEndpointProvider;
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
                .Include(p => p.Exam)
                    .ThenInclude(e => e.RubricCriterias)
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
                    { "DeepSeek V3",      message.ModelScores.OllamaLlama }
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
                Console.WriteLine($"[CONSUMER] Model skorları kaydedildi: Gemini={message.ModelScores.Gemini}, Groq={message.ModelScores.GroqLlama}, DeepSeek={message.ModelScores.OllamaLlama}");
            }

            var eval = message.Evaluation;
            int finalScore = isFailed ? 0 : (eval?.ToplamPuan ?? 0);

            // Per-criteria orantılı dağıtım
            string? rubricScoresJson = null;
            var rubricCriterias = paper.Exam?.RubricCriterias?.ToList();
            if (rubricCriterias != null && rubricCriterias.Count > 0)
            {
                int totalMax = rubricCriterias.Sum(r => r.MaxPoints);
                double ratio = totalMax > 0 ? (double)finalScore / totalMax : 0;
                int distributed = 0;
                var rubricItems = rubricCriterias.Select((r, i) => {
                    int earned = i == rubricCriterias.Count - 1
                        ? finalScore - distributed
                        : (int)Math.Round(r.MaxPoints * ratio);
                    earned = Math.Max(0, Math.Min(earned, r.MaxPoints));
                    distributed += earned;
                    return new { criteria = r.Criteria, maxPoints = r.MaxPoints, earnedPoints = earned };
                }).ToList();
                rubricScoresJson = JsonSerializer.Serialize(rubricItems);
            }

   
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
                    RubricScoresJson = rubricScoresJson,
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
                paper.FinalEvaluation.RubricScoresJson = rubricScoresJson;
                paper.FinalEvaluation.EvaluatedAt      = DateTime.UtcNow;
                Console.WriteLine($"[CONSUMER] FinalEvaluation güncellendi: {finalScore}/100");
            }

        
            if (paper.StudentId == null && message.StudentInfo != null)
            {
                User? matchedStudent = null;

                // Sınava ait sınıfın öğrencileri (öncelikli aday havuzu)
                var classStudents = await _dbContext.Exams
                    .Where(e => e.Id == paper.ExamId)
                    .SelectMany(e => e.Course.Class.StudentClasses.Select(sc => sc.Student))
                    .ToListAsync();

                // 1) StudentNumber ile (önce sınıf içinde, sonra global)
                if (!string.IsNullOrWhiteSpace(message.StudentInfo.StudentNumber))
                {
                    var studentNumber = message.StudentInfo.StudentNumber.Trim();
                    matchedStudent = classStudents.FirstOrDefault(u => u.StudentNumber == studentNumber)
                        ?? await _dbContext.Users.FirstOrDefaultAsync(u => u.StudentNumber == studentNumber);

                    if (matchedStudent != null)
                        Console.WriteLine($"[CONSUMER] Öğrenci numarasıyla eşleştirildi: {studentNumber} → {matchedStudent.Id}");
                }

                // 2) İsim eşleştirme — Türkçe locale + ad/soyad sırası karışıklığına dayanıklı
                if (matchedStudent == null
                    && (!string.IsNullOrWhiteSpace(message.StudentInfo.FirstName)
                        || !string.IsNullOrWhiteSpace(message.StudentInfo.LastName)))
                {
                    var tr = new System.Globalization.CultureInfo("tr-TR");
                    string Norm(string s) => (s ?? "").Trim().ToLower(tr);

                    var first = Norm(message.StudentInfo.FirstName);
                    var last  = Norm(message.StudentInfo.LastName);
                    var combinedRaw = $"{first} {last}".Trim();
                    // Bazen Gemini tüm adı tek alana koyabilir → tüm tokenları topla
                    var tokens = combinedRaw.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                    var sortedTokens = tokens.OrderBy(t => t).ToArray();

                    bool TokensEqual(User u)
                    {
                        var uTokens = ($"{Norm(u.FirstName)} {Norm(u.LastName)}")
                            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
                            .OrderBy(t => t).ToArray();
                        return uTokens.SequenceEqual(sortedTokens);
                    }

                    // Önce sınıf öğrencileri arasında, sonra tüm Users
                    matchedStudent = classStudents.FirstOrDefault(TokensEqual);

                    if (matchedStudent == null)
                    {
                        var allStudents = await _dbContext.Users
                            .Where(u => u.Role == UserRole.Student)
                            .ToListAsync();
                        matchedStudent = allStudents.FirstOrDefault(TokensEqual);
                    }

                    if (matchedStudent != null)
                        Console.WriteLine($"[CONSUMER] İsimle eşleştirildi: '{combinedRaw}' → {matchedStudent.Id}");
                    else
                        Console.WriteLine($"[CONSUMER][UYARI] Öğrenci bulunamadı: '{combinedRaw}' — StudentId null kalıyor");
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

            // Sınav başarılıysa ve bir öğrenciye atandıysa insight tetikle
            if (!isFailed && paper.StudentId.HasValue)
            {
                await TriggerInsightGenerationAsync(paper.StudentId.Value, eval);
            }
        }

        private async Task TriggerInsightGenerationAsync(Guid studentId, EvaluationMessage? eval)
        {
            try
            {
                // Öğrencinin mevcut insight kaydını ve tüm sınavlarını çek
                var insight = await _dbContext.StudentInsights
                    .FirstOrDefaultAsync(s => s.StudentId == studentId);

                var allEvals = await _dbContext.ExamPapers
                    .Where(ep => ep.StudentId == studentId && ep.FinalEvaluation != null)
                    .Include(ep => ep.FinalEvaluation)
                    .Select(ep => ep.FinalEvaluation!)
                    .ToListAsync();

                int totalExamCount = allEvals.Count;

                // Dirty flag'i set et (veya ilk kez oluştur)
                if (insight == null)
                {
                    insight = new StudentInsight
                    {
                        StudentId = studentId,
                        IsInsightDirty = true,
                        ExamCountAtLastInsight = 0
                    };
                    await _dbContext.StudentInsights.AddAsync(insight);
                }
                else
                {
                    insight.IsInsightDirty = true;
                }
                await _dbContext.SaveChangesAsync();

                // Full reset mi, delta mı?
                int examsSinceLastInsight = totalExamCount - insight.ExamCountAtLastInsight;
                bool isFullReset = insight.ExamCountAtLastInsight == 0 || examsSinceLastInsight >= 5;

                var command = new GenerateInsightCommand
                {
                    StudentId = studentId,
                    CurrentInsightText = insight.InsightText,
                    ExamCountAtLastInsight = insight.ExamCountAtLastInsight,
                    TotalExamCount = totalExamCount,
                    IsFullReset = isFullReset
                };

                if (isFullReset)
                {
                    // Tüm sınavların hatalarını gönder (son 10 ile sınırla)
                    var recentEvals = allEvals.TakeLast(10).ToList();
                    command.AllErrors = recentEvals.Select((fe, i) => new InsightErrorEntry
                    {
                        ExamIndex = i + 1,
                        SyntaxErrors = ParseErrorDescriptions(fe.SyntaxErrorsJson),
                        LogicErrors = ParseErrorDescriptions(fe.LogicErrorsJson)
                    }).ToList();
                }
                else
                {
                    // Sadece yeni sınavın hatalarını gönder
                    command.NewExamSyntaxErrors = eval?.SyntaxHatalari?
                        .Select(h => h.Aciklama).Where(a => !string.IsNullOrWhiteSpace(a)).ToList() ?? new();
                    command.NewExamLogicErrors = eval?.MantikHatalari?
                        .Select(h => h.Aciklama).Where(a => !string.IsNullOrWhiteSpace(a)).ToList() ?? new();
                }

                var endpoint = await _sendEndpointProvider.GetSendEndpoint(new Uri("queue:generate-insight-queue"));
                await endpoint.Send(command);
                Console.WriteLine($"[CONSUMER] Insight tetiklendi → StudentId: {studentId}, FullReset: {isFullReset}, ToplamSınav: {totalExamCount}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CONSUMER][UYARI] Insight tetikleme hatası (kritik değil): {ex.Message}");
            }
        }

        private static List<string> ParseErrorDescriptions(string? errorsJson)
        {
            if (string.IsNullOrWhiteSpace(errorsJson) || errorsJson == "[]")
                return new List<string>();

            try
            {
                var items = JsonSerializer.Deserialize<List<JsonElement>>(errorsJson);
                return items?
                    .Select(e => e.TryGetProperty("Description", out var d) ? d.GetString() ?? "" : "")
                    .Where(s => !string.IsNullOrWhiteSpace(s))
                    .ToList() ?? new();
            }
            catch { return new List<string>(); }
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
