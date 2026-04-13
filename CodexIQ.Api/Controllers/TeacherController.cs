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

    public TeacherController(ITeacherService teacherService)
    {
        _teacherService = teacherService;
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var result = await _teacherService.GetStatsAsync(GetUserId());
        return Ok(result);
    }

    [HttpGet("recent-uploads")]
    public async Task<IActionResult> GetRecentUploads()
    {
        var result = await _teacherService.GetRecentUploadsAsync(GetUserId());
        return Ok(result);
    }

    [HttpGet("course-averages")]
    public async Task<IActionResult> GetCourseAverages()
    {
        var result = await _teacherService.GetCourseAveragesAsync(GetUserId());
        return Ok(result);
    }

    [HttpGet("queue-status")]
    public async Task<IActionResult> GetQueueStatus()
    {
        var result = await _teacherService.GetQueueStatusAsync(GetUserId());
        return Ok(result);
    }

    [HttpPost("exams")]
    public async Task<IActionResult> CreateExam([FromBody] CreateExamRequestDto request)
    {
        try
        {
            var result = await _teacherService.CreateExamAsync(GetUserId(), request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("exams/{examId}/papers")]
    public async Task<IActionResult> UploadPapers(Guid examId, [FromForm] List<IFormFile> files)
    {
        try
        {
            if (files == null || !files.Any())
                return BadRequest(new { success = false, message = "Dosya yüklenmedi" });

            var result = await _teacherService.UploadPapersAsync(GetUserId(), examId, files);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("exams/{examId}/rubric")]
    public async Task<IActionResult> SaveRubric(Guid examId, [FromBody] SaveRubricRequestDto request)
    {
        try
        {
            await _teacherService.SaveRubricAsync(GetUserId(), examId, request);
            return Ok(new { success = true, message = "Rubrik kaydedildi" });
        }
        catch (Exception ex)
        {
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
        var result = await _teacherService.GetResultsAsync(
            GetUserId(), search, course, exam, sortBy, page, pageSize);
        return Ok(result);
    }

    [HttpGet("results/{id:guid}")]
    public async Task<IActionResult> GetResultDetail(Guid id)
    {
        var result = await _teacherService.GetResultDetailAsync(GetUserId(), id);
        if (result == null)
            return NotFound(new { success = false, message = "Sonuç bulunamadı" });
        return Ok(result);
    }

    [HttpPut("results/{id:guid}/override")]
    public async Task<IActionResult> OverrideScore(Guid id, [FromBody] OverrideScoreRequestDto request)
    {
        try
        {
            await _teacherService.OverrideScoreAsync(GetUserId(), id, request);
            return Ok(new { success = true, message = "Puan güncellendi" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPut("results/{id:guid}/note")]
    public async Task<IActionResult> UpdateNote(Guid id, [FromBody] UpdateNoteRequestDto request)
    {
        try
        {
            await _teacherService.UpdateNoteAsync(GetUserId(), id, request);
            return Ok(new { success = true, message = "Not güncellendi" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPut("results/{id:guid}/share")]
    public async Task<IActionResult> ShareResult(Guid id)
    {
        try
        {
            await _teacherService.ShareResultAsync(GetUserId(), id);
            return Ok(new { success = true, message = "Sonuç paylaşıldı" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPut("results/bulk-share")]
    public async Task<IActionResult> BulkShare([FromBody] BulkShareRequestDto request)
    {
        try
        {
            await _teacherService.BulkShareAsync(GetUserId(), request);
            return Ok(new { success = true, message = $"{request.ExamPaperIds.Count} sonuç paylaşıldı" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpGet("results/export/excel")]
    public async Task<IActionResult> ExportExcel([FromQuery] Guid examId)
    {
        try
        {
            var bytes = await _teacherService.ExportExcelAsync(GetUserId(), examId);
            return File(bytes, "text/csv", $"sonuclar_{examId}.csv");
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpGet("results/export/pdf")]
    public async Task<IActionResult> ExportPdf([FromQuery] Guid examId)
    {
        try
        {
            var bytes = await _teacherService.ExportPdfAsync(GetUserId(), examId);
            return File(bytes, "application/pdf", $"sonuclar_{examId}.pdf");
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    // Students
    [HttpGet("students")]
    public async Task<IActionResult> GetStudents([FromQuery] Guid? classId)
    {
        var result = await _teacherService.GetStudentsAsync(GetUserId(), classId);
        return Ok(result);
    }

    [HttpGet("students/{id:guid}/stats")]
    public async Task<IActionResult> GetStudentStats(Guid id)
    {
        var result = await _teacherService.GetStudentStatsAsync(GetUserId(), id);
        if (result == null)
            return NotFound(new { success = false, message = "Öğrenci bulunamadı" });
        return Ok(result);
    }

    // Profile
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        try
        {
            var result = await _teacherService.GetProfileAsync(GetUserId());
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateTeacherProfileRequestDto request)
    {
        try
        {
            await _teacherService.UpdateProfileAsync(GetUserId(), request);
            return Ok(new { success = true, message = "Profil güncellendi" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("exams/{examId}/start-evaluation")]
    public async Task<IActionResult> StartEvaluation(Guid examId, [FromServices] ISendEndpointProvider sendEndpointProvider)
    {
        try
        {

            await _teacherService.StartEvaluationAsync(GetUserId(), examId);

            // 2. Python'un dinleyeceği kuyruğa mesajı fırlatıyoruz!
            var endpoint = await sendEndpointProvider.GetSendEndpoint(new Uri("queue:evaluate-exam-queue"));

            await endpoint.Send(new CodexIQ.Infrastructure.Messaging.EvaluateExamCommand
            {
                ExamId = examId,
                TeacherId = GetUserId()
            });

            // 3. API'miz Python'u hiç beklemeden anında cevap dönüyor.
            return Ok(new { success = true, message = "Değerlendirme kuyruğa alındı, arka planda işleniyor." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }
}