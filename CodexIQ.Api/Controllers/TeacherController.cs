using CodexIQ.Application.Interfaces.Services;
using CodexIQ.Infrastructure.Messaging;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[ApiController]
[Route("api/teacher")]
[Authorize(Roles = "Teacher")]
public class TeacherController : ControllerBase
{
    private readonly ITeacherService _teacherService;
    private readonly ILogger<TeacherController> _logger;

    public TeacherController(ITeacherService teacherService, ILogger<TeacherController> logger)
    {
        _teacherService = teacherService;
        _logger = logger;
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        _logger.LogInformation("Dashboard istatistikleri görüntülendi");
        var result = await _teacherService.GetStatsAsync(GetUserId());
        return Ok(result);
    }

    [HttpGet("recent-uploads")]
    public async Task<IActionResult> GetRecentUploads()
    {
        _logger.LogInformation("Son yüklemeler görüntülendi");
        var result = await _teacherService.GetRecentUploadsAsync(GetUserId());
        return Ok(result);
    }

    [HttpGet("course-averages")]
    public async Task<IActionResult> GetCourseAverages()
    {
        _logger.LogInformation("Ders ortalamaları görüntülendi");
        var result = await _teacherService.GetCourseAveragesAsync(GetUserId());
        return Ok(result);
    }

    [HttpGet("queue-status")]
    public async Task<IActionResult> GetQueueStatus()
    {
        _logger.LogInformation("Kuyruk durumu görüntülendi");
        var result = await _teacherService.GetQueueStatusAsync(GetUserId());
        return Ok(result);
    }

    [HttpPost("exams")]
    public async Task<IActionResult> CreateExam([FromBody] CreateExamRequestDto request)
    {
        var result = await _teacherService.CreateExamAsync(GetUserId(), request);
        _logger.LogInformation("Sınav oluşturuldu: {ExamName} (ExamId: {ExamId})", request.Name, result.ExamId);
        return Ok(result);
    }

    [HttpPost("exams/{examId}/papers")]
    public async Task<IActionResult> UploadPapers(Guid examId)
    {
        var files = Request.Form.Files;

        if (files == null || files.Count == 0)
        {
            _logger.LogWarning("Dosya yüklenmeden kağıt ekleme denendi (ExamId: {ExamId})", examId);
            throw new CodexIQ.Application.Exceptions.ValidationException("Dosya yüklenmedi");
        }

        var result = await _teacherService.UploadPapersAsync(GetUserId(), examId, files.ToList());
        _logger.LogInformation("{Count} kağıt yüklendi (ExamId: {ExamId})", result.UploadedCount, examId);
        return Ok(result);
    }

    [HttpPost("exams/{examId}/rubric")]
    public async Task<IActionResult> SaveRubric(Guid examId, [FromBody] SaveRubricRequestDto request)
    {
        await _teacherService.SaveRubricAsync(GetUserId(), examId, request);
        _logger.LogInformation("Rubrik kaydedildi (ExamId: {ExamId})", examId);
        return Ok(new { success = true, message = "Rubrik kaydedildi" });
    }

    [HttpGet("results")]
    public async Task<IActionResult> GetResults(
        [FromQuery] string? search,
        [FromQuery] string? course,
        [FromQuery] string? exam,
        [FromQuery] string? sortBy,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        _logger.LogInformation("Sonuçlar listelendi (Sayfa: {Page})", page);
        var result = await _teacherService.GetResultsAsync(
            GetUserId(), search, course, exam, sortBy, page, pageSize);
        return Ok(result);
    }

    [HttpGet("results/{id:guid}")]
    public async Task<IActionResult> GetResultDetail(Guid id)
    {
        var result = await _teacherService.GetResultDetailAsync(GetUserId(), id);
        if (result == null)
        {
            _logger.LogWarning("Sonuç bulunamadı (ExamPaperId: {Id})", id);
            throw new CodexIQ.Application.Exceptions.NotFoundException("Sonuç bulunamadı");
        }
        _logger.LogInformation("Sonuç detayı görüntülendi (ExamPaperId: {Id})", id);
        return Ok(result);
    }

    [HttpPut("results/{id:guid}/override")]
    public async Task<IActionResult> OverrideScore(Guid id, [FromBody] OverrideScoreRequestDto request)
    {
        await _teacherService.OverrideScoreAsync(GetUserId(), id, request);
        _logger.LogInformation("Puan override edildi: {NewScore} (ExamPaperId: {Id})", request.NewScore, id);
        return Ok(new { success = true, message = "Puan güncellendi" });
    }

    [HttpPut("results/{id:guid}/rubric-scores")]
    public async Task<IActionResult> UpdateRubricScores(Guid id, [FromBody] UpdateRubricScoresDto dto)
    {
        await _teacherService.UpdateRubricScoresAsync(GetUserId(), id, dto);
        _logger.LogInformation("Rubric skorları güncellendi (ExamPaperId: {Id})", id);
        return Ok(new { success = true, message = "Rubric skorları güncellendi" });
    }

    [HttpPut("results/{id:guid}/note")]
    public async Task<IActionResult> UpdateNote(Guid id, [FromBody] UpdateNoteRequestDto request)
    {
        await _teacherService.UpdateNoteAsync(GetUserId(), id, request);
        _logger.LogInformation("Not güncellendi (ExamPaperId: {Id})", id);
        return Ok(new { success = true, message = "Not güncellendi" });
    }

    [HttpPut("results/{id:guid}/share")]
    public async Task<IActionResult> ShareResult(Guid id)
    {
        await _teacherService.ShareResultAsync(GetUserId(), id);
        _logger.LogInformation("Sonuç paylaşıldı (ExamPaperId: {Id})", id);
        return Ok(new { success = true, message = "Sonuç paylaşıldı" });
    }

    [HttpPut("results/bulk-share")]
    public async Task<IActionResult> BulkShare([FromBody] BulkShareRequestDto request)
    {
        await _teacherService.BulkShareAsync(GetUserId(), request);
        _logger.LogInformation("{Count} sonuç toplu paylaşıldı", request.ExamPaperIds.Count);
        return Ok(new { success = true, message = $"{request.ExamPaperIds.Count} sonuç paylaşıldı" });
    }

    [HttpGet("results/export/excel")]
    public async Task<IActionResult> ExportExcel([FromQuery] string? examName)
    {
        var bytes = await _teacherService.ExportExcelAsync(GetUserId(), examName);
        var safeName = string.IsNullOrEmpty(examName) ? "tum_sonuclar" : examName.Replace(" ", "_");
        _logger.LogInformation("Excel export yapıldı (ExamName: {ExamName})", examName);
        return File(bytes, "text/csv;charset=utf-8", $"{safeName}.csv");
    }

    [HttpGet("results/export/pdf")]
    public async Task<IActionResult> ExportPdf([FromQuery] string? examName)
    {
        var bytes = await _teacherService.ExportPdfAsync(GetUserId(), examName);
        var safeName = string.IsNullOrEmpty(examName) ? "tum_sonuclar" : examName.Replace(" ", "_");
        _logger.LogInformation("PDF export yapıldı (ExamName: {ExamName})", examName);
        return File(bytes, "application/pdf", $"{safeName}.pdf");
    }

    // Students
    [HttpGet("students")]
    public async Task<IActionResult> GetStudents([FromQuery] Guid? classId)
    {
        _logger.LogInformation("Öğrenci listesi görüntülendi (ClassId: {ClassId})", classId?.ToString() ?? "Tümü");
        var result = await _teacherService.GetStudentsAsync(GetUserId(), classId);
        return Ok(result);
    }

    [HttpGet("students/{id:guid}/stats")]
    public async Task<IActionResult> GetStudentStats(Guid id)
    {
        var result = await _teacherService.GetStudentStatsAsync(GetUserId(), id);
        if (result == null)
        {
            _logger.LogWarning("Öğrenci bulunamadı (StudentId: {Id})", id);
            throw new CodexIQ.Application.Exceptions.NotFoundException("Öğrenci bulunamadı");
        }
        _logger.LogInformation("Öğrenci istatistikleri görüntülendi: {StudentName} (StudentId: {Id})", result.FullName, id);
        return Ok(result);
    }

    // Profile
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var result = await _teacherService.GetProfileAsync(GetUserId());
        _logger.LogInformation("Profil görüntülendi");
        return Ok(result);
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateTeacherProfileRequestDto request)
    {
        await _teacherService.UpdateProfileAsync(GetUserId(), request);
        _logger.LogInformation("Profil güncellendi");
        return Ok(new { success = true, message = "Profil güncellendi" });
    }

    [HttpGet("courses")]
    public async Task<IActionResult> GetCourses()
    {
        _logger.LogInformation("Öğretmen ders listesi görüntülendi");
        var result = await _teacherService.GetCoursesAsync(GetUserId());
        return Ok(result);
    }

    [HttpGet("classes")]
    public async Task<IActionResult> GetClasses()
    {
        _logger.LogInformation("Öğretmen sınıf listesi görüntülendi");
        var result = await _teacherService.GetClassesAsync(GetUserId());
        return Ok(result);
    }

    // Regrade Requests
    [HttpGet("regrade-requests")]
    public async Task<IActionResult> GetRegradeRequests()
    {
        var result = await _teacherService.GetPendingRegradeRequestsAsync(GetUserId());
        _logger.LogInformation("İtiraz talepleri görüntülendi ({Count} bekliyor)", result.Count);
        return Ok(result);
    }

    [HttpPost("regrade-requests/{requestId:guid}/resolve")]
    public async Task<IActionResult> ResolveRegradeRequest(Guid requestId, [FromBody] ResolveRegradeRequestDto dto)
    {
        await _teacherService.ResolveRegradeRequestAsync(GetUserId(), requestId, dto);
        _logger.LogInformation("İtiraz talebi sonuçlandırıldı (RequestId: {Id}, Karar: {Decision})", requestId, dto.Decision);
        return Ok(new { success = true });
    }

    [HttpGet("regrade-requests/count")]
    public async Task<IActionResult> GetRegradeRequestCount()
    {
        var count = await _teacherService.GetPendingRegradeCountAsync(GetUserId());
        return Ok(new { count });
    }

    [HttpPost("classes/{classId:guid}/regenerate-code")]
    public async Task<IActionResult> RegenerateJoinCode(Guid classId)
    {
        var newCode = await _teacherService.RegenerateJoinCodeAsync(GetUserId(), classId);
        _logger.LogInformation("Sınıf katılım kodu yenilendi (ClassId: {ClassId})", classId);
        return Ok(new { joinCode = newCode });
    }

    [HttpGet("analytics/exams")]
    public async Task<IActionResult> GetAllExams()
    {
        var result = await _teacherService.GetAllExamsAsync(GetUserId());
        return Ok(result);
    }

    [HttpGet("analytics/top-errors")]
    public async Task<IActionResult> GetTopExamErrors([FromQuery] Guid examId)
    {
        var result = await _teacherService.GetTopExamErrorsAsync(GetUserId(), examId);
        _logger.LogInformation("Top exam errors alındı (ExamId: {ExamId})", examId);
        return Ok(result);
    }

    [HttpGet("announcements")]
    public async Task<IActionResult> GetAnnouncements()
    {
        _logger.LogInformation("Öğretmen duyurular görüntülendi");
        var result = await _teacherService.GetAnnouncementsAsync();
        return Ok(result);
    }

    [HttpPost("exams/{examId}/start-evaluation")]
    public async Task<IActionResult> StartEvaluation(Guid examId, [FromServices] ISendEndpointProvider sendEndpointProvider)
    {
        // Servisten her kağıt için kuyruk bilgilerini al
        var papers = await _teacherService.StartEvaluationAsync(GetUserId(), examId);

        if (!papers.Any())
        {
            return Ok(new { success = true, message = "Bekleyen kağıt bulunamadı." });
        }

        var endpoint = await sendEndpointProvider.GetSendEndpoint(new Uri("queue:evaluate-exam-queue"));
        var teacherId = GetUserId();

        // Her kağıt için ayrı komut gönder
        foreach (var paper in papers)
        {
            await endpoint.Send(new CodexIQ.Infrastructure.Messaging.EvaluateExamCommand
            {
                ExamId              = examId,
                TeacherId           = teacherId,
                ExamPaperId         = paper.PaperId,
                ImagePath           = paper.ImagePath,
                TeacherContext      = paper.TeacherContext,
                ProgrammingLanguage = paper.ProgrammingLanguage
            });
        }

        _logger.LogInformation(
            "Değerlendirme başlatıldı: {Count} kağıt kuyruğa alındı (ExamId: {ExamId})",
            papers.Count, examId);

        return Ok(new
        {
            success = true,
            message = $"Değerlendirme başlatıldı. {papers.Count} kağıt sıraya alındı."
        });
    }
}
