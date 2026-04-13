
using CodexIQ.Application.Interfaces.CoreDataInterfaces;
using CodexIQ.Application.Interfaces.Services;
using CodexIQ.Application.Interfaces.Storage;
using CodexIQ.Domain.Entities;
using CodexIQ.Domain.Enums;
using Microsoft.AspNetCore.Http;
using System.Text.Json;

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
        if (exam == null) throw new Exception("Sınav bulunamadı");

        var papers = new List<ExamPaper>();
        var fileNames = new List<string>();

        foreach (var file in files)
        {
            var relativePath = await _fileStorage.SaveFileAsync(file, $"exams/{examId}");

            papers.Add(new ExamPaper
            {
                ExamId = examId,
                StudentId = Guid.Parse("afac0074-3d9d-4b49-929b-60ea034a676a"),
                ImagePath = relativePath,
                UploadAt = DateTime.UtcNow,
                Status = EvaluationStatus.Pending
            });

            fileNames.Add(file.FileName);
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
        if (exam == null) throw new Exception("Sınav bulunamadı");
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

    public async Task StartEvaluationAsync(Guid teacherId, Guid examId)
    {
        var exam = await _unitOfWork.Teacher.GetExamByIdAsync(examId, teacherId);
        if (exam == null) throw new Exception("Sınav bulunamadı");

        if (!exam.ExamPaper.Any())
            throw new Exception("Sınav kağıdı yüklenmemiş");

        foreach (var paper in exam.ExamPaper.Where(p => p.Status == EvaluationStatus.Pending))
        {
            paper.Status = EvaluationStatus.Extracting;
        }

        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<PaginatedResult<TeacherResultListItemDto>> GetResultsAsync(
    Guid teacherId, string? search, string? course, string? exam, string? sortBy, int page, int pageSize)
    {
        var (papers, totalCount) = await _unitOfWork.Teacher
            .GetResultsAsync(teacherId, search, course, exam, sortBy, page, pageSize);

        var items = papers.Select(ep => new TeacherResultListItemDto
        {
            Id = ep.Id,
            StudentName = $"{ep.Student.FirstName} {ep.Student.LastName}",
            StudentNo = ep.Student.Email,
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

        var rubricScores = paper.Exam.RubricCriterias.Select(r => new RubricScoreDto
        {
            Criteria = r.Criteria,
            MaxPoints = r.MaxPoints,
            AiScore = r.MaxPoints 
        }).ToList();

        return new TeacherResultDetailDto
        {
            Id = paper.Id,
            StudentName = $"{paper.Student.FirstName} {paper.Student.LastName}",
            StudentNo = paper.Student.Email,
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
        if (paper?.FinalEvaluation == null) throw new Exception("Sonuç bulunamadı");

        if (!paper.FinalEvaluation.IsOverridden)
        {
            paper.FinalEvaluation.OriginalScore = paper.FinalEvaluation.FinalScore;
        }

        paper.FinalEvaluation.FinalScore = request.NewScore;
        paper.FinalEvaluation.IsOverridden = true;
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task UpdateNoteAsync(Guid teacherId, Guid examPaperId, UpdateNoteRequestDto request)
    {
        var paper = await _unitOfWork.Teacher.GetResultDetailAsync(teacherId, examPaperId);
        if (paper?.FinalEvaluation == null) throw new Exception("Sonuç bulunamadı");

        paper.FinalEvaluation.TeacherNote = request.Note;
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task ShareResultAsync(Guid teacherId, Guid examPaperId)
    {
        var paper = await _unitOfWork.Teacher.GetResultDetailAsync(teacherId, examPaperId);
        if (paper?.FinalEvaluation == null) throw new Exception("Sonuç bulunamadı");

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

    public async Task<byte[]> ExportExcelAsync(Guid teacherId, Guid examId)
    {
        var papers = await _unitOfWork.Teacher.GetExamPapersForExportAsync(teacherId, examId);
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("Öğrenci,E-posta,Sınav,Ders,Puan,Syntax Hata,Mantık Hata,Paylaşıldı");

        foreach (var ep in papers)
        {
            sb.AppendLine($"{ep.Student.FirstName} {ep.Student.LastName},{ep.Student.Email},{ep.Exam.Name},{ep.Exam.Course.Name},{ep.FinalEvaluation!.FinalScore},{ep.FinalEvaluation.SyntaxErrorCount},{ep.FinalEvaluation.LogicErrorCount},{ep.FinalEvaluation.IsShared}");
        }

        return System.Text.Encoding.UTF8.GetBytes(sb.ToString());
    }

    public async Task<byte[]> ExportPdfAsync(Guid teacherId, Guid examId)
    {
        return await ExportExcelAsync(teacherId, examId);
    }

    public async Task<List<TeacherStudentListItemDto>> GetStudentsAsync(Guid teacherId, Guid? classId)
    {
        var students = await _unitOfWork.Teacher.GetStudentsByTeacherAsync(teacherId, classId);

        return students.Select(s => new TeacherStudentListItemDto
        {
            Id = s.Student.Id,
            FullName = $"{s.Student.FirstName} {s.Student.LastName}",
            Email = s.Student.Email,
            ClassName = s.ClassName
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
        if (user == null) throw new Exception("Kullanıcı bulunamadı");

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
        if (user == null) throw new Exception("Kullanıcı bulunamadı");

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.Email = request.Email;

        _unitOfWork.User.Update(user);
        await _unitOfWork.SaveChangesAsync();
    }
}