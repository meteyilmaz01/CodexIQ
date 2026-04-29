
using CodexIQ.Application.Exceptions;
using CodexIQ.Application.Interfaces.CoreDataInterfaces;
using CodexIQ.Application.Interfaces.Services;
using CodexIQ.Application.Interfaces.Storage;
using CodexIQ.Domain.Entities;
using CodexIQ.Domain.Enums;
using Microsoft.AspNetCore.Http;
using System.Text.Json;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

public class TeacherService : ITeacherService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IFileStorageService _fileStorage;

    public TeacherService(IUnitOfWork unitOfWork, IFileStorageService fileStorage)
    {
        _unitOfWork = unitOfWork;
        _fileStorage = fileStorage;
    }

    public async Task<TeacherStatsDto> GetStatsAsync(Guid teacherId)
    {
        return new TeacherStatsDto
        {
            TotalStudents = await _unitOfWork.Teacher.GetTotalStudentCountAsync(teacherId),
            EvaluatedExams = await _unitOfWork.Teacher.GetEvaluatedExamCountAsync(teacherId),
            PendingJobs = await _unitOfWork.Teacher.GetPendingJobCountAsync(teacherId),
            ClassAverage = await _unitOfWork.Teacher.GetClassAverageAsync(teacherId)
        };
    }

    public async Task<List<RecentUploadDto>> GetRecentUploadsAsync(Guid teacherId)
    {
        var exams = await _unitOfWork.Teacher.GetRecentExamsAsync(teacherId, 5);

        return exams.Select(e =>
        {
            var papers = e.ExamPaper;
            var allCompleted = papers.All(p => p.Status == EvaluationStatus.Completed);
            var anyProcessing = papers.Any(p => p.Status == EvaluationStatus.Extracting);
            var status = allCompleted ? "completed"
                       : anyProcessing ? "processing"
                       : "pending";

            return new RecentUploadDto
            {
                Id = e.Id,
                ExamName = e.Name,
                PaperCount = papers.Count,
                Date = e.CreatedDate,
                Status = status
            };
        }).ToList();
    }

    public async Task<List<CourseAverageDto>> GetCourseAveragesAsync(Guid teacherId)
    {
        var averages = await _unitOfWork.Teacher.GetCourseAveragesAsync(teacherId);

        return averages.Select(a => new CourseAverageDto
        {
            CourseName = a.CourseName,
            Average = a.Average,
            StudentCount = a.StudentCount
        }).ToList();
    }

    public async Task<QueueStatusDto> GetQueueStatusAsync(Guid teacherId)
    {
        var (completed, processing, pending, failed) = await _unitOfWork.Teacher.GetQueueStatusAsync(teacherId);

        return new QueueStatusDto
        {
            Completed = completed,
            Processing = processing,
            Pending = pending,
            Failed = failed
        };
    }

    public async Task<CreateExamResponseDto> CreateExamAsync(Guid teacherId, CreateExamRequestDto request)
    {
        var exam = new Exam
        {
            Name = request.Name,
            CourseId = request.CourseId,
            TeacherId = teacherId,
            CodePurpose = request.CodePurpose,
            ProgrammingLanguage = request.ProgrammingLanguage,
            IsPublished = false
        };

        await _unitOfWork.Teacher.CreateExamAsync(exam);
        await _unitOfWork.SaveChangesAsync();

        return new CreateExamResponseDto
        {
            ExamId = exam.Id,
            Message = "Sınav oluşturuldu"
        };
    }

    public async Task<UploadPapersResponseDto> UploadPapersAsync(
        Guid teacherId, Guid examId, List<IFormFile> files)
    {
        var exam = await _unitOfWork.Teacher.GetExamByIdAsync(examId, teacherId);
        if (exam == null) throw new NotFoundException("Sınav bulunamadı");

        var papers = new List<ExamPaper>();
        var fileNames = new List<string>();

        foreach (var file in files)
        {
            bool isPdf = file.ContentType == "application/pdf"
                      || Path.GetExtension(file.FileName).ToLowerInvariant() == ".pdf";

            if (isPdf)
            {
                // PDF → sayfalara böl → her sayfa ayrı ExamPaper (1 sayfa = 1 öğrenci kağıdı)
                using var ms = new System.IO.MemoryStream();
                await file.CopyToAsync(ms);
                var pdfBytes = ms.ToArray();

                var pagePaths = await _fileStorage.SavePdfPagesAsync(pdfBytes, $"exams/{examId}");

                foreach (var pagePath in pagePaths)
                {
                    papers.Add(new ExamPaper
                    {
                        ExamId = examId,
                        StudentId = null,   // OCR sonrası ExamResultConsumer tarafından doldurulur
                        ImagePath = pagePath,
                        UploadAt = DateTime.UtcNow,
                        Status = EvaluationStatus.Pending
                    });
                    fileNames.Add(System.IO.Path.GetFileName(pagePath));
                }
            }
            else
            {
                // Normal resim dosyası (JPG, PNG, vb.)
                var relativePath = await _fileStorage.SaveFileAsync(file, $"exams/{examId}");

                papers.Add(new ExamPaper
                {
                    ExamId = examId,
                    StudentId = null,   // OCR sonrası doldurulur
                    ImagePath = relativePath,
                    UploadAt = DateTime.UtcNow,
                    Status = EvaluationStatus.Pending
                });
                fileNames.Add(file.FileName);
            }
        }

        await _unitOfWork.Teacher.AddExamPapersAsync(papers);
        await _unitOfWork.SaveChangesAsync();

        return new UploadPapersResponseDto
        {
            UploadedCount = papers.Count,
            FileNames = fileNames
        };
    }

    public async Task SaveRubricAsync(Guid teacherId, Guid examId, SaveRubricRequestDto request)
    {
        var exam = await _unitOfWork.Teacher.GetExamByIdAsync(examId, teacherId);
        if (exam == null) throw new NotFoundException("Sınav bulunamadı");
        await _unitOfWork.Teacher.DeleteRubricByExamIdAsync(examId);

        var criterias = request.Items.Select(item => new RubricCriteria
        {
            ExamId = examId,
            Criteria = item.Criteria,
            MaxPoints = item.MaxPoints
        }).ToList();

        await _unitOfWork.Teacher.AddRubricAsync(criterias);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<List<ExamPaperQueueDto>> StartEvaluationAsync(Guid teacherId, Guid examId)
    {
        var exam = await _unitOfWork.Teacher.GetExamByIdAsync(examId, teacherId);
        if (exam == null) throw new NotFoundException("Sınav bulunamadı");

        if (!exam.ExamPaper.Any())
            throw new BusinessException("Sınav kağıdı yüklenmemiş");

        var teacherContext = BuildTeacherContext(exam);
        var language = exam.ProgrammingLanguage ?? "unknown";

        var queue = new List<ExamPaperQueueDto>();

        foreach (var paper in exam.ExamPaper.Where(p => p.Status == EvaluationStatus.Pending))
        {
            paper.Status = EvaluationStatus.Extracting;
            queue.Add(new ExamPaperQueueDto
            {
                PaperId           = paper.Id,
                ImagePath         = paper.ImagePath,
                TeacherContext    = teacherContext,
                ProgrammingLanguage = language
            });
        }

        await _unitOfWork.SaveChangesAsync();
        return queue;
    }

    private static string BuildTeacherContext(Exam exam)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine($"## Sınav: {exam.Name}");
        sb.AppendLine($"## Kodun Amacı: {exam.CodePurpose}");
        sb.AppendLine($"## Programlama Dili: {exam.ProgrammingLanguage}");

        if (exam.RubricCriterias != null && exam.RubricCriterias.Any())
        {
            sb.AppendLine("## Değerlendirme Kriterleri (Rubric):");
            foreach (var criteria in exam.RubricCriterias)
                sb.AppendLine($"  - {criteria.Criteria}: {criteria.MaxPoints} puan");
        }

        sb.AppendLine("## OCR Toleransı: El yazısı kaynaklı küçük yazım hatalarına (eksik girintileme vb.) toleranslı ol.");
        return sb.ToString();
    }

    public async Task<PaginatedResult<TeacherResultListItemDto>> GetResultsAsync(
    Guid teacherId, string? search, string? course, string? exam, string? sortBy, int page, int pageSize)
    {
        var (papers, totalCount) = await _unitOfWork.Teacher
            .GetResultsAsync(teacherId, search, course, exam, sortBy, page, pageSize);

        var items = papers.Select(ep => new TeacherResultListItemDto
        {
            Id = ep.Id,
            ExamId = ep.ExamId,
            StudentName = ep.Student != null
                ? $"{ep.Student.FirstName} {ep.Student.LastName}"
                : "OCR Bekleniyor",
            StudentNo = ep.Student?.StudentNumber ?? "",
            ExamName = ep.Exam.Name,
            CourseName = ep.Exam.Course.Name,
            Date = ep.FinalEvaluation!.EvaluatedAt,
            Score = ep.FinalEvaluation.FinalScore,
            SyntaxErrorCount = ep.FinalEvaluation.SyntaxErrorCount,
            LogicErrorCount = ep.FinalEvaluation.LogicErrorCount,
            IsShared = ep.FinalEvaluation.IsShared,
            IsOverridden = ep.FinalEvaluation.IsOverridden
        }).ToList();

        return new PaginatedResult<TeacherResultListItemDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<TeacherResultDetailDto?> GetResultDetailAsync(Guid teacherId, Guid examPaperId)
    {
        var paper = await _unitOfWork.Teacher.GetResultDetailAsync(teacherId, examPaperId);
        if (paper?.FinalEvaluation == null) return null;

        var syntaxErrors = new List<CodeErrorDto>();
        var logicErrors = new List<CodeErrorDto>();

        if (!string.IsNullOrEmpty(paper.FinalEvaluation.SyntaxErrorsJson))
        {
            syntaxErrors = JsonSerializer.Deserialize<List<CodeErrorDto>>(
                paper.FinalEvaluation.SyntaxErrorsJson,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();
        }

        if (!string.IsNullOrEmpty(paper.FinalEvaluation.LogicErrorsJson))
        {
            logicErrors = JsonSerializer.Deserialize<List<CodeErrorDto>>(
                paper.FinalEvaluation.LogicErrorsJson,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();
        }

        // JSON'dan gerçek per-criteria skorları oku, yoksa orantılı tahmin yap
        List<RubricBreakdownItemDto> storedBreakdown = new();
        if (!string.IsNullOrEmpty(paper.FinalEvaluation.RubricScoresJson))
        {
            storedBreakdown = JsonSerializer.Deserialize<List<RubricBreakdownItemDto>>(
                paper.FinalEvaluation.RubricScoresJson,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();
        }

        var rubricScores = paper.Exam.RubricCriterias.Select(r =>
        {
            var stored = storedBreakdown.FirstOrDefault(s => s.Criteria == r.Criteria);
            return new RubricScoreDto
            {
                Criteria  = r.Criteria,
                MaxPoints = r.MaxPoints,
                AiScore   = stored?.EarnedPoints ?? 0
            };
        }).ToList();

        return new TeacherResultDetailDto
        {
            Id = paper.Id,
            ExamId = paper.ExamId,
            StudentName = paper.Student != null
                ? $"{paper.Student.FirstName} {paper.Student.LastName}"
                : "OCR Bekleniyor",
            StudentNo = paper.Student?.StudentNumber ?? "",
            ExamName = paper.Exam.Name,
            CourseName = paper.Exam.Course.Name,
            CodePurpose = paper.Exam.CodePurpose,
            Date = paper.FinalEvaluation.EvaluatedAt,
            TotalScore = paper.FinalEvaluation.FinalScore,
            OriginalScore = paper.FinalEvaluation.OriginalScore,
            IsOverridden = paper.FinalEvaluation.IsOverridden,
            IsShared = paper.FinalEvaluation.IsShared,
            Code = paper.ExtractedCode?.RawCode ?? string.Empty,
            TeacherNote = paper.FinalEvaluation.TeacherNote,
            SyntaxErrors = syntaxErrors,
            LogicErrors = logicErrors,
            ModelScores = paper.AIModelResults.Select(ai => new ModelScoreDto
            {
                ModelName = ai.ModelName,
                Score = ai.Score
            }).ToList(),
            RubricScores = rubricScores
        };
    }

    public async Task OverrideScoreAsync(Guid teacherId, Guid examPaperId, OverrideScoreRequestDto request)
    {
        var paper = await _unitOfWork.Teacher.GetResultDetailAsync(teacherId, examPaperId);
        if (paper?.FinalEvaluation == null) throw new NotFoundException("Sonuç bulunamadı");

        if (!paper.FinalEvaluation.IsOverridden)
        {
            paper.FinalEvaluation.OriginalScore = paper.FinalEvaluation.FinalScore;
        }

        paper.FinalEvaluation.FinalScore = request.NewScore;
        paper.FinalEvaluation.IsOverridden = true;
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task UpdateRubricScoresAsync(Guid teacherId, Guid examPaperId, UpdateRubricScoresDto dto)
    {
        var paper = await _unitOfWork.Teacher.GetResultDetailAsync(teacherId, examPaperId);
        if (paper?.FinalEvaluation == null) throw new NotFoundException("Sonuç bulunamadı");

        var items = dto.Items.Select(i => new { criteria = i.Criteria, maxPoints = i.MaxPoints, earnedPoints = i.EarnedPoints });
        paper.FinalEvaluation.RubricScoresJson = JsonSerializer.Serialize(items);

        // Toplam puanı da güncelle (rubric toplamı yeni skor olarak ayarla)
        var newTotal = dto.Items.Sum(i => i.EarnedPoints);
        if (!paper.FinalEvaluation.IsOverridden)
            paper.FinalEvaluation.OriginalScore = paper.FinalEvaluation.FinalScore;
        paper.FinalEvaluation.FinalScore   = newTotal;
        paper.FinalEvaluation.IsOverridden = true;

        await _unitOfWork.SaveChangesAsync();
    }

    public async Task UpdateNoteAsync(Guid teacherId, Guid examPaperId, UpdateNoteRequestDto request)
    {
        var paper = await _unitOfWork.Teacher.GetResultDetailAsync(teacherId, examPaperId);
        if (paper?.FinalEvaluation == null) throw new NotFoundException("Sonuç bulunamadı");

        paper.FinalEvaluation.TeacherNote = request.Note;
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task ShareResultAsync(Guid teacherId, Guid examPaperId)
    {
        var paper = await _unitOfWork.Teacher.GetResultDetailAsync(teacherId, examPaperId);
        if (paper?.FinalEvaluation == null) throw new NotFoundException("Sonuç bulunamadı");

        paper.FinalEvaluation.IsShared = true;
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task BulkShareAsync(Guid teacherId, BulkShareRequestDto request)
    {
        var papers = await _unitOfWork.Teacher.GetExamPapersByIdsAsync(teacherId, request.ExamPaperIds);

        foreach (var paper in papers)
        {
            if (paper.FinalEvaluation != null)
            {
                paper.FinalEvaluation.IsShared = true;
            }
        }

        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<byte[]> ExportExcelAsync(Guid teacherId, string? examName)
    {
        var papers = await _unitOfWork.Teacher.GetExamPapersForExportAsync(teacherId, examName);
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("Öğrenci;E-posta;Sınav;Ders;Puan;Syntax Hata;Mantık Hata;Paylaşıldı");

        foreach (var ep in papers)
        {
            var studentName  = ep.Student != null ? $"{ep.Student.FirstName} {ep.Student.LastName}" : "OCR Bekleniyor";
            var studentEmail = ep.Student?.Email ?? "";
            sb.AppendLine($"{studentName};{studentEmail};{ep.Exam.Name};{ep.Exam.Course.Name};{ep.FinalEvaluation!.FinalScore};{ep.FinalEvaluation.SyntaxErrorCount};{ep.FinalEvaluation.LogicErrorCount};{ep.FinalEvaluation.IsShared}");
        }

        var bom = new byte[] { 0xEF, 0xBB, 0xBF };
        var content = System.Text.Encoding.UTF8.GetBytes(sb.ToString());
        return bom.Concat(content).ToArray();
    }

    public async Task<byte[]> ExportPdfAsync(Guid teacherId, string? examName)
    {
        var papers = await _unitOfWork.Teacher.GetExamPapersForExportAsync(teacherId, examName);

        QuestPDF.Settings.License = LicenseType.Community;

        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);
                page.DefaultTextStyle(t => t.FontSize(10).FontFamily("Arial"));

                page.Header().Column(col =>
                {
                    col.Item().Text(string.IsNullOrEmpty(examName) ? "Tüm Sınav Sonuçları" : examName)
                        .FontSize(16).Bold().FontColor(Colors.Blue.Medium);
                    col.Item().Text($"Oluşturulma: {DateTime.Now:dd.MM.yyyy HH:mm}")
                        .FontSize(9).FontColor(Colors.Grey.Medium);
                    col.Item().PaddingTop(6).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                });

                page.Content().PaddingTop(12).Table(table =>
                {
                    table.ColumnsDefinition(c =>
                    {
                        c.RelativeColumn(2.5f);
                        c.RelativeColumn(2.5f);
                        c.RelativeColumn(2f);
                        c.RelativeColumn(1.5f);
                        c.RelativeColumn(0.8f);
                        c.RelativeColumn(0.8f);
                        c.RelativeColumn(0.8f);
                        c.RelativeColumn(1f);
                    });

                    static IContainer HeaderCell(IContainer c) =>
                        c.Background(Colors.Blue.Medium).Padding(5).AlignCenter().AlignMiddle();

                    static IContainer DataCell(IContainer c) =>
                        c.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4).AlignMiddle();

                    string[] headers = { "Öğrenci", "E-posta", "Sınav", "Ders", "Puan", "Syntax", "Mantık", "Paylaşıldı" };
                    table.Header(header =>
                    {
                        foreach (var h in headers)
                            header.Cell().Element(HeaderCell).Text(h).FontColor(Colors.White).Bold().FontSize(9);
                    });

                    foreach (var ep in papers)
                    {
                        var studentName = ep.Student != null ? $"{ep.Student.FirstName} {ep.Student.LastName}" : "OCR Bekleniyor";
                        var score       = ep.FinalEvaluation!.FinalScore;
                        var scoreColor  = score >= 85 ? Colors.Green.Medium
                                        : score >= 70 ? Colors.Blue.Medium
                                        : score >= 50 ? Colors.Orange.Medium
                                        : Colors.Red.Medium;

                        string[] cells =
                        {
                            studentName,
                            ep.Student?.Email ?? "",
                            ep.Exam.Name,
                            ep.Exam.Course.Name,
                            score.ToString(),
                            ep.FinalEvaluation.SyntaxErrorCount.ToString(),
                            ep.FinalEvaluation.LogicErrorCount.ToString(),
                            ep.FinalEvaluation.IsShared ? "Evet" : "Hayır"
                        };

                        for (int i = 0; i < cells.Length; i++)
                        {
                            var isScore = i == 4;
                            var txt = table.Cell().Element(DataCell).Text(cells[i])
                                .FontColor(isScore ? scoreColor : Colors.Black);
                            if (isScore) txt.Bold();
                        }
                    }
                });

                page.Footer().AlignCenter().Text(t =>
                {
                    t.Span("Sayfa ").FontSize(8).FontColor(Colors.Grey.Medium);
                    t.CurrentPageNumber().FontSize(8).FontColor(Colors.Grey.Medium);
                    t.Span(" / ").FontSize(8).FontColor(Colors.Grey.Medium);
                    t.TotalPages().FontSize(8).FontColor(Colors.Grey.Medium);
                });
            });
        }).GeneratePdf();
    }

    public async Task<List<TeacherStudentListItemDto>> GetStudentsAsync(Guid teacherId, Guid? classId)
    {
        var students = await _unitOfWork.Teacher.GetStudentsByTeacherAsync(teacherId, classId);

        return students.Select(s => new TeacherStudentListItemDto
        {
            Id = s.Student.Id,
            FullName = $"{s.Student.FirstName} {s.Student.LastName}",
            Email = s.Student.Email,
            ClassName = s.ClassName,
            Average = s.Average,
            ExamCount = s.ExamCount
        }).ToList();
    }

    public async Task<TeacherStudentStatsDto?> GetStudentStatsAsync(Guid teacherId, Guid studentId)
    {
        var result = await _unitOfWork.Teacher.GetStudentStatsAsync(teacherId, studentId);
        if (result == null) return null;

        var (student, averageScore, examCount) = result.Value;

        return new TeacherStudentStatsDto
        {
            StudentId = student.Id,
            FullName = $"{student.FirstName} {student.LastName}",
            Email = student.Email,
            AverageScore = averageScore,
            ExamCount = examCount
        };
    }

    public async Task<TeacherProfileDto> GetProfileAsync(Guid teacherId)
    {
        var user = await _unitOfWork.User.GetByIdAsync(teacherId);
        if (user == null) throw new NotFoundException("Kullanıcı bulunamadı");

        return new TeacherProfileDto
        {
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email
        };
    }

    public async Task UpdateProfileAsync(Guid teacherId, UpdateTeacherProfileRequestDto request)
    {
        var user = await _unitOfWork.User.GetByIdAsync(teacherId);
        if (user == null) throw new NotFoundException("Kullanıcı bulunamadı");

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.Email = request.Email;

        _unitOfWork.User.Update(user);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<List<TeacherCourseDto>> GetCoursesAsync(Guid teacherId)
    {
        return await _unitOfWork.Teacher.GetCoursesByTeacherIdAsync(teacherId);
    }

    public async Task<List<TeacherClassDto>> GetClassesAsync(Guid teacherId)
    {
        return await _unitOfWork.Teacher.GetClassesByTeacherIdAsync(teacherId);
    }

    public async Task<string> RegenerateJoinCodeAsync(Guid teacherId, Guid classId)
    {
        var cls = await _unitOfWork.Teacher.GetClassByIdAsync(classId, teacherId);
        if (cls == null)
            throw new CodexIQ.Application.Exceptions.NotFoundException("Sınıf bulunamadı.");

        var newCode = GenerateJoinCode();
        await _unitOfWork.Teacher.UpdateClassJoinCodeAsync(classId, newCode);
        return newCode;
    }

    private static string GenerateJoinCode()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var rng = new Random();
        return new string(Enumerable.Range(0, 6).Select(_ => chars[rng.Next(chars.Length)]).ToArray());
    }

    public async Task<List<TeacherRegradeRequestListItemDto>> GetPendingRegradeRequestsAsync(Guid teacherId)
    {
        var requests = await _unitOfWork.Teacher.GetPendingRegradeRequestsAsync(teacherId);
        return requests.Select(r => new TeacherRegradeRequestListItemDto
        {
            Id           = r.Id,
            ExamPaperId  = r.ExamPaperId,
            StudentName  = $"{r.Student.FirstName} {r.Student.LastName}",
            ExamName     = r.ExamPaper.Exam.Name,
            CourseName   = r.ExamPaper.Exam.Course.Name,
            CurrentScore = r.ExamPaper.FinalEvaluation?.FinalScore ?? 0,
            Reason       = r.Reason,
            CreatedDate  = r.CreatedDate
        }).ToList();
    }

    public async Task ResolveRegradeRequestAsync(Guid teacherId, Guid requestId, ResolveRegradeRequestDto dto)
    {
        var request = await _unitOfWork.Teacher.GetRegradeRequestByIdAsync(requestId, teacherId);
        if (request == null)
            throw new NotFoundException("İtiraz talebi bulunamadı.");

        if (request.Status != RegradeStatus.Pending)
            throw new ValidationException("Bu talep zaten sonuçlandırılmış.");

        var approved = dto.Decision.Equals("Approved", StringComparison.OrdinalIgnoreCase);
        request.Status      = approved ? RegradeStatus.Approved : RegradeStatus.Rejected;
        request.TeacherNote = dto.TeacherNote;
        request.ResolvedAt  = DateTime.UtcNow;

        if (approved && dto.NewScore.HasValue)
        {
            var eval = request.ExamPaper.FinalEvaluation;
            if (eval != null)
            {
                eval.OriginalScore = eval.IsOverridden ? eval.OriginalScore : eval.FinalScore;
                eval.FinalScore    = dto.NewScore.Value;
                eval.IsOverridden  = true;
            }
        }

        await _unitOfWork.Teacher.UpdateRegradeRequestAsync(request);
    }

    public async Task<int> GetPendingRegradeCountAsync(Guid teacherId)
    {
        return await _unitOfWork.Teacher.GetPendingRegradeCountAsync(teacherId);
    }

    public async Task<List<AdminAnnouncementDto>> GetAnnouncementsAsync()
    {
        return await _unitOfWork.Admin.GetAnnouncementsAsync();
    }

    public async Task<List<TopExamErrorDto>> GetTopExamErrorsAsync(Guid teacherId, Guid examId)
    {
        return await _unitOfWork.Teacher.GetTopExamErrorsAsync(examId, teacherId);
    }

    public async Task<List<ExamSummaryDto>> GetAllExamsAsync(Guid teacherId)
    {
        var exams = await _unitOfWork.Teacher.GetAllExamsAsync(teacherId);
        return exams.Select(e => new ExamSummaryDto
        {
            Id         = e.Id,
            Name       = e.Name,
            CourseName = e.Course.Name,
            PaperCount = e.ExamPaper.Count,
            CreatedDate = e.CreatedDate
        }).ToList();
    }

    public async Task DeleteExamAsync(Guid teacherId, Guid examId)
    {
        var exam = await _unitOfWork.Teacher.GetExamWithPapersAsync(examId, teacherId);
        if (exam == null)
            throw new NotFoundException("Sınav bulunamadı.");

        await _unitOfWork.Teacher.DeleteExamAsync(exam);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task DeleteExamPaperAsync(Guid teacherId, Guid examPaperId)
    {
        var paper = await _unitOfWork.Teacher.GetExamPaperByIdAsync(examPaperId, teacherId);
        if (paper == null)
            throw new NotFoundException("Sınav kağıdı bulunamadı.");

        await _unitOfWork.Teacher.DeleteExamPaperAsync(paper);
        await _unitOfWork.SaveChangesAsync();
    }
}