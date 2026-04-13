using CodexIQ.Application.Interfaces.Services;
using CodexIQ.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[ApiController]
[Route("api/student")]
[Authorize(Roles = "Student")]
public class StudentController : ControllerBase
{
    private readonly IStudentService _studentService;

    public StudentController(IStudentService studentService)
    {
        _studentService = studentService;
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var result = await _studentService.GetStatsDashboardAsync(GetUserId());
        return Ok(result);
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var result = await _studentService.GetProfileAsync(GetUserId());
        return Ok(result);
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequestDto request)
    {
        await _studentService.UpdateProfileAsync(GetUserId(), request);
        return Ok(new { success = true, message = "Profil güncellendi" });
    }

    [HttpGet("recent-results")]
    public async Task<IActionResult> GetRecentResults()
    {
        var result = await _studentService.GetRecentResultsAsync(GetUserId());
        return Ok(result);
    }

    [HttpGet("weak-topics")]
    public async Task<IActionResult> GetWeakTopics()
    {
        var result = await _studentService.GetWeakTopicsAsync(GetUserId());
        return Ok(result);
    }

    [HttpGet("results/{id}")]
    public async Task<IActionResult> GetExamResultDetail(Guid id)
    {
        var result = await _studentService.GetExamResultDetailAsync(GetUserId(), id);

        if (result == null)
            return NotFound(new { success = false, message = "Sonuç bulunamadı" });

        return Ok(result);
    }

    [HttpGet("results")]
    public async Task<IActionResult> GetExamResults(
    [FromQuery] string? search,
    [FromQuery] string? course,
    [FromQuery] string? sortBy,
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 10)
    {
        var result = await _studentService.GetExamResultsAsync(
            GetUserId(), search, course, sortBy, page, pageSize);
        return Ok(result);
    }
}