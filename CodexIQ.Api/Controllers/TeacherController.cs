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
        try
        {
            var result = await _teacherService.CreateExamAsync(GetUserId(), request);
            _logger.LogInformation("Sınav oluşturuldu: {ExamName} (ExamId: {ExamId})", request.Name, result.ExamId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Sınav oluşturma başarısız: {ExamName}", request.Name);
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("exams/{examId}/papers")]
    public async Task<IActionResult> UploadPapers(Guid examId, [FromForm] List<IFormFile> files)
    {
        try
        {
            if (files == null || !files.Any())
            {
                _logger.LogWarning("Dosya yüklenmeden kağıt ekleme denendi (ExamId: {ExamId})", examId);
                return BadRequest(new { success = false, message = "Dosya yüklenmedi" });
            }

            var result = await _teacherService.UploadPapersAsync(GetUserId(), examId, files);
            _logger.LogInformation("{Count} kağıt yüklendi (ExamId: {ExamId})", result.UploadedCount, examId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Kağıt yükleme başarısız (ExamId: {ExamId})", examId);
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("exams/{examId}/rubric")]
    public async Task<IActionResult> SaveRubric(Guid examId, [FromBody] SaveRubricRequestDto request)
    {
        try
        {
            await _teacherService.SaveRubricAsync(GetUserId(), examId, request);
            _logger.LogInformation("Rubrik kaydedildi (ExamId: {ExamId})", examId);
            return Ok(new { success = true, message = "Rubrik kaydedildi" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Rubrik kaydetme başarısız (ExamId: {ExamId})", examId);
            return BadRequest(new { success = false, message = ex.Message });
        }
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
            return NotFound(new { success = false, message = "Sonuç bulunamadı" });
        }
        _logger.LogInformation("Sonuç detayı görüntülendi (ExamPaperId: {Id})", id);
        return Ok(result);
    }

    [HttpPut("results/{id:guid}/override")]
    public async Task<IActionResult> OverrideScore(Guid id, [FromBody] OverrideScoreRequestDto request)
    {
        try
        {
            await _teacherService.OverrideScoreAsync(GetUserId(), id, request);
            _logger.LogInformation("Puan override edildi: {NewScore} (ExamPaperId: {Id})", request.NewScore, id);
            return Ok(new { success = true, message = "Puan güncellendi" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Puan override başarısız (ExamPaperId: {Id})", id);
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPut("results/{id:guid}/note")]
    public async Task<IActionResult> UpdateNote(Guid id, [FromBody] UpdateNoteRequestDto request)
    {
        try
        {
            await _teacherService.UpdateNoteAsync(GetUserId(), id, request);
            _logger.LogInformation("Not güncellendi (ExamPaperId: {Id})", id);
            return Ok(new { success = true, message = "Not güncellendi" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Not güncelleme başarısız (ExamPaperId: {Id})", id);
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPut("results/{id:guid}/share")]
    public async Task<IActionResult> ShareResult(Guid id)
    {
        try
        {
            await _teacherService.ShareResultAsync(GetUserId(), id);
            _logger.LogInformation("Sonuç paylaşıldı (ExamPaperId: {Id})", id);
            return Ok(new { success = true, message = "Sonuç paylaşıldı" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Sonuç paylaşma başarısız (ExamPaperId: {Id})", id);
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPut("results/bulk-share")]
    public async Task<IActionResult> BulkShare([FromBody] BulkShareRequestDto request)
    {
        try
        {
            await _teacherService.BulkShareAsync(GetUserId(), request);
            _logger.LogInformation("{Count} sonuç toplu paylaşıldı", request.ExamPaperIds.Count);
            return Ok(new { success = true, message = $"{request.ExamPaperIds.Count} sonuç paylaşıldı" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Toplu paylaşma başarısız");
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpGet("results/export/excel")]
    public async Task<IActionResult> ExportExcel([FromQuery] Guid examId)
    {
        try
        {
            var bytes = await _teacherService.ExportExcelAsync(GetUserId(), examId);
            _logger.LogInformation("Excel export yapıldı (ExamId: {ExamId})", examId);
            return File(bytes, "text/csv", $"sonuclar_{examId}.csv");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Excel export başarısız (ExamId: {ExamId})", examId);
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpGet("results/export/pdf")]
    public async Task<IActionResult> ExportPdf([FromQuery] Guid examId)
    {
        try
        {
            var bytes = await _teacherService.ExportPdfAsync(GetUserId(), examId);
            _logger.LogInformation("PDF export yapıldı (ExamId: {ExamId})", examId);
            return File(bytes, "application/pdf", $"sonuclar_{examId}.pdf");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "PDF export başarısız (ExamId: {ExamId})", examId);
            return BadRequest(new { success = false, message = ex.Message });
        }
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
            return NotFound(new { success = false, message = "Öğrenci bulunamadı" });
        }
        _logger.LogInformation("Öğrenci istatistikleri görüntülendi: {StudentName} (StudentId: {Id})", result.FullName, id);
        return Ok(result);
    }

    // Profile
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        try
        {
            var result = await _teacherService.GetProfileAsync(GetUserId());
            _logger.LogInformation("Profil görüntülendi");
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Profil görüntüleme başarısız");
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateTeacherProfileRequestDto request)
    {
        try
        {
            await _teacherService.UpdateProfileAsync(GetUserId(), request);
            _logger.LogInformation("Profil güncellendi");
            return Ok(new { success = true, message = "Profil güncellendi" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Profil güncelleme başarısız");
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("exams/{examId}/start-evaluation")]
    public async Task<IActionResult> StartEvaluation(Guid examId, [FromServices] ISendEndpointProvider sendEndpointProvider)
    {
        try
        {
            await _teacherService.StartEvaluationAsync(GetUserId(), examId);

            var endpoint = await sendEndpointProvider.GetSendEndpoint(new Uri("queue:evaluate-exam-queue"));

            await endpoint.Send(new CodexIQ.Infrastructure.Messaging.EvaluateExamCommand
            {
                ExamId = examId,
                TeacherId = GetUserId()
            });

            _logger.LogInformation("Değerlendirme başlatıldı (ExamId: {ExamId})", examId);
            return Ok(new { success = true, message = "Değerlendirme kuyruğa alındı, arka planda işleniyor." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Değerlendirme başlatma başarısız (ExamId: {ExamId})", examId);
            return BadRequest(new { success = false, message = ex.Message });
        }
    }
}
