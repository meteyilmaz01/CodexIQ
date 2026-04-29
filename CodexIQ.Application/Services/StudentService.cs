using CodexIQ.Application.DTOs.StudentsDTOs;
using CodexIQ.Application.DTOs.StudentsDTOs.StudentDashboardDTOS;
using CodexIQ.Application.Exceptions;
using CodexIQ.Application.Interfaces.CoreDataInterfaces;
using CodexIQ.Application.Interfaces.Repositories;
using CodexIQ.Application.Interfaces.Services;
using CodexIQ.Application.Interfaces.Storage;
using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;

namespace CodexIQ.Application.Services
{
    public class StudentService : IStudentService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IFileStorageService _fileStorage;
        private readonly IStudentInsightRepository _insightRepository;

        public StudentService(IUnitOfWork unitOfWork, IFileStorageService fileStorage, IStudentInsightRepository insightRepository)
        {
            _unitOfWork = unitOfWork;
            _fileStorage = fileStorage;
            _insightRepository = insightRepository;
        }

        public async Task<List<RecentResultsDto>> GetRecentResultsAsync(Guid studentId)
        {
            var papers = await _unitOfWork.Student.GetRecentExamPapersAsync(studentId, 5);

            var items = papers.Select(ep => new RecentResultsDto
            {
                Id = ep.Id,
                ExamName = ep.Exam.Name,
                CourseName = ep.Exam.Course.Name,
                UploadedAt = ep.FinalEvaluation!.EvaluatedAt,
                FinalScore = ep.FinalEvaluation.FinalScore,
                Status = ep.FinalEvaluation.FinalScore >= 85 ? "High"
                       : ep.FinalEvaluation.FinalScore >= 70 ? "Medium"
                       : "Low"
            }).ToList();

            return items;
        }

        public async Task<StudentProfileDto> GetProfileAsync(Guid studentId)
        {
            var user = await _unitOfWork.User.GetByIdAsync(studentId);
            if (user == null) throw new NotFoundException("Kullanıcı bulunamadı");

            return new StudentProfileDto
            {
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email
            };
        }

        public async Task UpdateProfileAsync(Guid studentId, UpdateProfileRequestDto request)
        {
            var user = await _unitOfWork.User.GetByIdAsync(studentId);
            if (user == null) throw new NotFoundException("Kullanıcı bulunamadı");

            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.Email = request.Email;

            _unitOfWork.User.Update(user);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<StatsDto> GetStatsDashboardAsync(Guid studentId)
        {
            var average = await _unitOfWork.Student.GetAverageScoreAsync(studentId);
            var lastScore = await _unitOfWork.Student.GetLastExamScoreAsync(studentId);
            var totalExams = await _unitOfWork.Student.GetTotalExamCountAsync(studentId);
            var codeTests = await _unitOfWork.Student.GetCodeTestCountAsync(studentId);

            return new StatsDto
            {
                AverageScore = average,
                LastScored = lastScore,
                TotalExamsTaken = totalExams,
                CodeTestCount = codeTests
            };

        }

        public async Task<List<WeakTopicsDto>> GetWeakTopicsAsync(Guid studentId)
        {
            var topics = await _unitOfWork.Student.GetWeakTopicsAsync(studentId);

            return topics.Select(t => new WeakTopicsDto
            {
                Topic = t.Key,
                SuccessPercentage = t.Value
            }).ToList();
        }

        public async Task<ExamResultDetailDto?> GetExamResultDetailAsync(Guid studentId, Guid examPaperId)
        {
            var paper = await _unitOfWork.Student.GetExamResultDetailAsync(studentId, examPaperId);

            if (paper == null || paper.FinalEvaluation == null)
                return null;

            var syntaxErrors = new List<CodeErrorDto>();
            var logicErrors = new List<CodeErrorDto>();

            if (!string.IsNullOrEmpty(paper.FinalEvaluation.SyntaxErrorsJson))
            {
                syntaxErrors = JsonSerializer.Deserialize<List<CodeErrorDto>>(
                    paper.FinalEvaluation.SyntaxErrorsJson,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                ) ?? new();
            }

            if (!string.IsNullOrEmpty(paper.FinalEvaluation.LogicErrorsJson))
            {
                logicErrors = JsonSerializer.Deserialize<List<CodeErrorDto>>(
                    paper.FinalEvaluation.LogicErrorsJson,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                ) ?? new();
            }

            var rubricBreakdown = new List<RubricBreakdownItemDto>();
            if (!string.IsNullOrEmpty(paper.FinalEvaluation.RubricScoresJson))
            {
                rubricBreakdown = JsonSerializer.Deserialize<List<RubricBreakdownItemDto>>(
                    paper.FinalEvaluation.RubricScoresJson,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                ) ?? new();
            }

            return new ExamResultDetailDto
            {
                Id = paper.Id,
                ExamName = paper.Exam.Name,
                CourseName = paper.Exam.Course.Name,
                CodePurpose = paper.Exam.CodePurpose,
                Date = paper.FinalEvaluation.EvaluatedAt,
                TotalScore = paper.FinalEvaluation.FinalScore,
                IsOverridden = paper.FinalEvaluation.IsOverridden,
                OriginalScore = paper.FinalEvaluation.IsOverridden ? paper.FinalEvaluation.OriginalScore : null,
                Code = paper.ExtractedCode?.RawCode ?? string.Empty,
                TeacherNote = paper.FinalEvaluation.TeacherNote,
                SyntaxErrors = syntaxErrors,
                LogicErrors = logicErrors,
                ModelScores = paper.AIModelResults.Select(ai => new ModelScoreDto
                {
                    ModelName = ai.ModelName,
                    Score = ai.Score
                }).ToList(),
                RubricBreakdown = rubricBreakdown
            };
        }

    public async Task<byte[]?> GetExamPaperImageAsync(Guid studentId, Guid examPaperId)
    {
        // Öğrencinin kendi kağıdını getir (student repository zaten studentId filtresi uygular)
        var paper = await _unitOfWork.Student.GetExamResultDetailAsync(studentId, examPaperId);

        if (paper == null || string.IsNullOrWhiteSpace(paper.ImagePath))
            return null;

        // Öğretmen paylaşmamışsa görseli gösterme
        if (paper.FinalEvaluation?.IsShared != true)
            return null;

        try
        {
            return await _fileStorage.ReadFileAsync(paper.ImagePath);
        }
        catch
        {
            return null;
        }
    }

    public async Task<PaginatedResult<ExamResultListItemDto>> GetExamResultsAsync(
            Guid studentId,
            string? search,
            string? course,
            string? sortBy,
            int page,
            int pageSize)
        {
            var (papers, totalCount) = await _unitOfWork.Student
                .GetExamResultsAsync(studentId, search, course, sortBy, page, pageSize);

            var items = papers.Select(ep => new ExamResultListItemDto
            {
                Id = ep.Id,
                ExamName = ep.Exam.Name,
                CourseName = ep.Exam.Course.Name,
                Date = ep.FinalEvaluation!.EvaluatedAt,
                Score = ep.FinalEvaluation.FinalScore,
                SyntaxErrorCount = ep.FinalEvaluation.SyntaxErrorCount,
                LogicErrorCount = ep.FinalEvaluation.LogicErrorCount,
                Status = ep.FinalEvaluation.FinalScore >= 85 ? "High"
                       : ep.FinalEvaluation.FinalScore >= 70 ? "Medium"
                       : "Low"
            }).ToList();

            return new PaginatedResult<ExamResultListItemDto>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<List<AdminAnnouncementDto>> GetAnnouncementsAsync()
        {
            return await _unitOfWork.Admin.GetAnnouncementsAsync();
        }

        public async Task CreateRegradeRequestAsync(Guid studentId, Guid examPaperId, string reason)
        {
            var paper = await _unitOfWork.Student.GetExamResultDetailAsync(studentId, examPaperId);
            if (paper == null || paper.FinalEvaluation == null)
                throw new NotFoundException("Sınav sonucu bulunamadı.");

            var existing = await _unitOfWork.Student.GetActiveRegradeRequestAsync(studentId, examPaperId);
            if (existing != null && existing.Status != CodexIQ.Domain.Entities.RegradeStatus.Rejected)
                throw new ValidationException("Bu sınav için zaten aktif bir itiraz talebiniz var.");

            var request = new CodexIQ.Domain.Entities.RegradeRequest
            {
                ExamPaperId = examPaperId,
                StudentId   = studentId,
                TeacherId   = paper.Exam.TeacherId,
                Reason      = reason,
                Status      = CodexIQ.Domain.Entities.RegradeStatus.Pending
            };

            await _unitOfWork.Student.AddRegradeRequestAsync(request);
        }

        public async Task<RegradeRequestStatusDto?> GetRegradeRequestStatusAsync(Guid studentId, Guid examPaperId)
        {
            var req = await _unitOfWork.Student.GetActiveRegradeRequestAsync(studentId, examPaperId);
            if (req == null) return null;

            return new RegradeRequestStatusDto
            {
                Id          = req.Id,
                Status      = req.Status.ToString(),
                TeacherNote = req.TeacherNote,
                CreatedDate = req.CreatedDate,
                ResolvedAt  = req.ResolvedAt
            };
        }

        public async Task<JoinClassResultDto> JoinClassAsync(Guid studentId, string joinCode)
        {
            var cls = await _unitOfWork.Student.GetClassByJoinCodeAsync(joinCode.Trim().ToUpper());
            if (cls == null)
                throw new NotFoundException("Geçersiz katılım kodu. Lütfen öğretmeninizden doğru kodu alın.");

            var alreadyIn = await _unitOfWork.Student.IsStudentInClassAsync(studentId, cls.Id);
            if (alreadyIn)
                throw new ValidationException("Bu sınıfa zaten kayıtlısınız.");

            await _unitOfWork.Student.AddStudentToClassAsync(studentId, cls.Id);

            return new JoinClassResultDto { ClassId = cls.Id, ClassName = cls.Name };
        }

        public async Task<List<ExamNotificationDto>> GetExamNotificationsAsync(Guid studentId)
        {
            var cutoff = DateTime.UtcNow.AddDays(-14);
            var papers = await _unitOfWork.Student.GetRecentExamPapersAsync(studentId, 20);
            var result = new List<ExamNotificationDto>();

            foreach (var ep in papers.Where(ep => ep.FinalEvaluation != null && ep.FinalEvaluation.EvaluatedAt >= cutoff))
            {
                result.Add(new ExamNotificationDto
                {
                    ExamPaperId = ep.Id,
                    ExamName    = ep.Exam.Name,
                    CourseName  = ep.Exam.Course.Name,
                    EvaluatedAt = ep.FinalEvaluation!.EvaluatedAt,
                    Type        = "evaluated"
                });

                if (ep.FinalEvaluation.IsOverridden)
                {
                    result.Add(new ExamNotificationDto
                    {
                        ExamPaperId   = ep.Id,
                        ExamName      = ep.Exam.Name,
                        CourseName    = ep.Exam.Course.Name,
                        EvaluatedAt   = ep.FinalEvaluation.EvaluatedAt,
                        Type          = "overridden",
                        OriginalScore = ep.FinalEvaluation.OriginalScore,
                        NewScore      = ep.FinalEvaluation.FinalScore
                    });
                }
            }

            return result;
        }

        public async Task<List<StudentProgressDto>> GetProgressAsync(Guid studentId)
        {
            var papers = await _unitOfWork.Student.GetProgressPapersAsync(studentId);

            return papers.Select(ep =>
            {
                int maxScore = ep.Exam.RubricCriterias != null && ep.Exam.RubricCriterias.Any()
                    ? ep.Exam.RubricCriterias.Sum(r => r.MaxPoints)
                    : 100;

                return new StudentProgressDto
                {
                    ExamName   = ep.Exam.Name,
                    CourseName = ep.Exam.Course.Name,
                    Date       = ep.FinalEvaluation!.EvaluatedAt,
                    Score      = ep.FinalEvaluation.FinalScore,
                    MaxScore   = maxScore
                };
            }).ToList();
        }

        public async Task<StudentErrorSummaryDto> GetErrorSummaryAsync(Guid studentId)
        {
            var evaluations = await _unitOfWork.Student.GetAllFinalEvaluationsAsync(studentId);

            var syntaxErrors = new List<string>();
            var logicErrors = new List<string>();

            foreach (var fe in evaluations)
            {
                if (!string.IsNullOrEmpty(fe.SyntaxErrorsJson))
                {
                    try
                    {
                        var items = JsonSerializer.Deserialize<List<JsonElement>>(fe.SyntaxErrorsJson);
                        if (items != null)
                            syntaxErrors.AddRange(items.Select(e =>
                                e.TryGetProperty("Description", out var p) ? p.GetString() ?? "" :
                                e.TryGetProperty("description", out var d) ? d.GetString() ?? "" :
                                e.TryGetProperty("aciklama", out var a) ? a.GetString() ?? "" : "").Where(s => !string.IsNullOrEmpty(s)));
                    }
                    catch { }
                }
                if (!string.IsNullOrEmpty(fe.LogicErrorsJson))
                {
                    try
                    {
                        var items = JsonSerializer.Deserialize<List<JsonElement>>(fe.LogicErrorsJson);
                        if (items != null)
                            logicErrors.AddRange(items.Select(e =>
                                e.TryGetProperty("Description", out var p) ? p.GetString() ?? "" :
                                e.TryGetProperty("description", out var d) ? d.GetString() ?? "" :
                                e.TryGetProperty("aciklama", out var a) ? a.GetString() ?? "" : "").Where(s => !string.IsNullOrEmpty(s)));
                    }
                    catch { }
                }
            }

            return new StudentErrorSummaryDto
            {
                SyntaxErrorCount = evaluations.Sum(fe => fe.SyntaxErrorCount),
                LogicErrorCount  = evaluations.Sum(fe => fe.LogicErrorCount),
                TopSyntaxErrors  = syntaxErrors.GroupBy(e => e).OrderByDescending(g => g.Count()).Take(3).Select(g => g.Key).ToList(),
                TopLogicErrors   = logicErrors.GroupBy(e => e).OrderByDescending(g => g.Count()).Take(3).Select(g => g.Key).ToList()
            };
        }

        public async Task<StudentInsightDto> GetInsightAsync(Guid studentId)
        {
            var insight = await _insightRepository.GetByStudentIdAsync(studentId);

            if (insight == null || string.IsNullOrWhiteSpace(insight.InsightText))
                return new StudentInsightDto { IsReady = false };

            return new StudentInsightDto
            {
                InsightText = insight.InsightText,
                GeneratedAt = insight.InsightGeneratedAt,
                IsReady = true
            };
        }
    }
}
