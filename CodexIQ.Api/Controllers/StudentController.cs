using CodexIQ.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

[ApiController]
[Route("api/student")]
[Authorize(Roles = "Student")]
public class StudentController : ControllerBase
{
    private readonly IStudentService _studentService;
    private readonly ILogger<StudentController> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public StudentController(
        IStudentService studentService,
        ILogger<StudentController> logger,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        _studentService = studentService;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
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
    public async Task<IActionResult> ConvertCode([FromBody] ConvertCodeRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.ImageBase64))
            return BadRequest(new { success = false, message = "Görsel boş olamaz." });

        var apiKey = _configuration["Gemini:ApiKey"];
        var model = _configuration["Gemini:Model"] ?? "gemini-2.5-flash";
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogError("Gemini:ApiKey appsettings'te tanımlı değil");
            return StatusCode(503, new { success = false, message = "OCR servisi yapılandırılmamış (API key eksik)." });
        }

        // data:image/jpeg;base64,XXX formatını temizle
        var base64 = request.ImageBase64;
        var comma = base64.IndexOf(',');
        var mimeType = "image/jpeg";
        if (comma > 0)
        {
            var header = base64.Substring(0, comma);
            var mimeMatch = Regex.Match(header, @"data:([^;]+);");
            if (mimeMatch.Success) mimeType = mimeMatch.Groups[1].Value;
            base64 = base64.Substring(comma + 1);
        }

        var prompt = $@"You are a strict, high-precision data transcription engine.
Transcribe the handwritten {request.Language} code in this image exactly as written.
- ZERO autocorrect: do not fix spelling, syntax or logic errors.
- Preserve indentation and line breaks.
- Do NOT transcribe the student info (name/number) at the top-right corner. Only the code.
- Output ONLY the raw code text. No markdown fences, no explanations.";

        var payload = new
        {
            contents = new[]
            {
                new
                {
                    parts = new object[]
                    {
                        new { text = prompt },
                        new { inline_data = new { mime_type = mimeType, data = base64 } }
                    }
                }
            },
            generationConfig = new { temperature = 0.1 }
        };

        var http = _httpClientFactory.CreateClient();
        http.Timeout = TimeSpan.FromSeconds(60);
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

        try
        {
            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await http.PostAsync(url, content);
            var body = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Gemini OCR hatası: {Status} - {Body}", response.StatusCode, body);
                return StatusCode(503, new { success = false, message = $"OCR servisi hata döndürdü: {response.StatusCode}" });
            }

            using var doc = JsonDocument.Parse(body);
            var text = doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString() ?? string.Empty;

            // markdown fence temizliği
            text = Regex.Replace(text, @"^```[a-zA-Z]*\s*\n?", "", RegexOptions.Multiline);
            text = text.Replace("```", "").Trim();

            _logger.LogInformation("Kod çevirisi yapıldı (Language: {Lang}, Karakter: {Len})", request.Language, text.Length);
            return Ok(new { success = true, code = text });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Gemini OCR exception");
            return StatusCode(503, new { success = false, message = "OCR servisine ulaşılamadı." });
        }
    }

    [HttpPost("run-code")]
    public async Task<IActionResult> RunCode([FromBody] RunCodeRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Code))
            return BadRequest(new { success = false, message = "Kod boş olamaz." });

        var workerUrl = _configuration["PythonWorker:BaseUrl"] ?? "http://localhost:8765";

        var http = _httpClientFactory.CreateClient();
        http.Timeout = TimeSpan.FromMinutes(3); // ensemble değerlendirme uzun sürebilir

        try
        {
            var payload = new { code = request.Code, language = request.Language };
            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await http.PostAsync($"{workerUrl.TrimEnd('/')}/code-test", content);
            var body = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Python worker code-test hatası: {Status} - {Body}", response.StatusCode, body);
                return StatusCode(503, new { success = false, message = "Kod test servisi hata döndürdü.", detail = body });
            }

            _logger.LogInformation("Kod test değerlendirmesi tamamlandı (Language: {Lang})", request.Language);
            return Content(body, "application/json"); // Python'dan gelen yapısal sonucu birebir geçir
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Python worker HTTP exception");
            return StatusCode(503, new { success = false, message = "Python worker çalışmıyor ya da erişilemiyor." });
        }
    }
}
