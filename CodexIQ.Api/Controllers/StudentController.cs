using CodexIQ.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[ApiController]
[Route("api/student")]
[Authorize(Roles = "Student")]
public class StudentController : ControllerBase
{
    private readonly IStudentService _studentService;
    private readonly ILogger<StudentController> _logger;

    public StudentController(IStudentService studentService, ILogger<StudentController> logger)
    {
        _studentService = studentService;
        _logger = logger;
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        _logger.LogInformation("Dashboard istatistikleri görüntülendi");
        var result = await _studentService.GetStatsDashboardAsync(GetUserId());
        return Ok(result);
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        _logger.LogInformation("Profil görüntülendi");
        var result = await _studentService.GetProfileAsync(GetUserId());
        return Ok(result);
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequestDto request)
    {
        await _studentService.UpdateProfileAsync(GetUserId(), request);
        _logger.LogInformation("Profil güncellendi");
        return Ok(new { success = true, message = "Profil güncellendi" });
    }

    [HttpGet("recent-results")]
    public async Task<IActionResult> GetRecentResults()
    {
        _logger.LogInformation("Son sonuçlar görüntülendi");
        var result = await _studentService.GetRecentResultsAsync(GetUserId());
        return Ok(result);
    }

    [HttpGet("weak-topics")]
    public async Task<IActionResult> GetWeakTopics()
    {
        _logger.LogInformation("Zayıf konular görüntülendi");
        var result = await _studentService.GetWeakTopicsAsync(GetUserId());
        return Ok(result);
    }

    [HttpGet("results/{id}")]
    public async Task<IActionResult> GetExamResultDetail(Guid id)
    {
        var result = await _studentService.GetExamResultDetailAsync(GetUserId(), id);

        if (result == null)
        {
            _logger.LogWarning("Sonuç bulunamadı (ExamPaperId: {Id})", id);
            throw new CodexIQ.Application.Exceptions.NotFoundException("Sonuç bulunamadı");
        }

        _logger.LogInformation("Sınav sonucu detayı görüntülendi (ExamPaperId: {Id})", id);
        return Ok(result);
    }

    /// <summary>
    /// Öğrencinin sınav kağıdının orijinal görselini döndürür.
    /// Sonuç öğretmen tarafından paylaşılmamışsa 404 döner.
    /// </summary>
    [HttpGet("results/{id}/paper-image")]
    public async Task<IActionResult> GetPaperImage(Guid id)
    {
        var imageBytes = await _studentService.GetExamPaperImageAsync(GetUserId(), id);

        if (imageBytes == null)
        {
            _logger.LogWarning("Kağıt görseli bulunamadı veya paylaşılmamış (ExamPaperId: {Id})", id);
            throw new CodexIQ.Application.Exceptions.NotFoundException("Kağıt görseli bulunamadı veya henüz paylaşılmamış.");
        }

        _logger.LogInformation("Kağıt görseli görüntülendi (ExamPaperId: {Id})", id);
        return File(imageBytes, "image/jpeg");
    }

    [HttpGet("results")]
    public async Task<IActionResult> GetExamResults(
    [FromQuery] string? search,
    [FromQuery] string? course,
    [FromQuery] string? sortBy,
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 10)
    {
        _logger.LogInformation("Sınav sonuçları listelendi (Sayfa: {Page})", page);
        var result = await _studentService.GetExamResultsAsync(
            GetUserId(), search, course, sortBy, page, pageSize);
        return Ok(result);
    }

    [HttpGet("announcements")]
    public async Task<IActionResult> GetAnnouncements()
    {
        _logger.LogInformation("Öğrenci duyurular görüntülendi");
        var result = await _studentService.GetAnnouncementsAsync();
        return Ok(result);
    }

    [HttpPost("convert-code")]
    public IActionResult ConvertCode([FromBody] ConvertCodeRequestDto request)
    {
        // TODO: Gemini entegrasyonu eklendiğinde gerçek OCR yapılacak
        _logger.LogWarning("Kod çevirme servisi henüz entegre edilmemiş (Language: {Lang})", request.Language);
        return StatusCode(503, new
        {
            success = false,
            message = "Kod çevirme servisi şu an kullanılamıyor. Python worker'ın çalışır durumda olduğundan emin olun."
        });
    }

    [HttpPost("run-code")]
    public IActionResult RunCode([FromBody] RunCodeRequestDto request)
    {
        // TODO: Sandboxed kod çalıştırma ortamı eklendiğinde aktive edilecek
        _logger.LogWarning("Kod çalıştırma servisi henüz entegre edilmemiş (Language: {Lang})", request.Language);
        return StatusCode(503, new
        {
            success = false,
            message = "Kod çalıştırma servisi şu an kullanılamıyor."
        });
    }
}
