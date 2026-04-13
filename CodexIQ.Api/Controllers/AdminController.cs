using CodexIQ.Application.Interfaces.Services;
using CodexIQ.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    private Guid GetUserId()
        => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
        => Ok(await _adminService.GetDashboardAsync());

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search,
        [FromQuery] UserRole? role,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
        => Ok(await _adminService.GetUsersAsync(search, role, isActive, page, pageSize));

    [HttpPatch("users/{id:guid}/status")]
    public async Task<IActionResult> UpdateUserStatus(Guid id, [FromBody] UpdateUserStatusRequestDto request)
    {
        await _adminService.UpdateUserStatusAsync(id, request.IsActive);
        return Ok(new { success = true, message = "Kullanıcı durumu güncellendi" });
    }

    [HttpGet("announcements")]
    public async Task<IActionResult> GetAnnouncements()
        => Ok(await _adminService.GetAnnouncementsAsync());

    [HttpPost("announcements")]
    public async Task<IActionResult> CreateAnnouncement([FromBody] CreateAnnouncementRequestDto request)
    {
        await _adminService.CreateAnnouncementAsync(GetUserId(), request);
        return Ok(new { success = true, message = "Duyuru oluşturuldu" });
    }

    [HttpPut("announcements/{id:guid}")]
    public async Task<IActionResult> UpdateAnnouncement(Guid id, [FromBody] UpdateAnnouncementRequestDto request)
    {
        await _adminService.UpdateAnnouncementAsync(id, request);
        return Ok(new { success = true, message = "Duyuru güncellendi" });
    }

    [HttpDelete("announcements/{id:guid}")]
    public async Task<IActionResult> DeleteAnnouncement(Guid id)
    {
        await _adminService.DeleteAnnouncementAsync(id);
        return Ok(new { success = true, message = "Duyuru silindi" });
    }

    [HttpGet("classes")]
    public async Task<IActionResult> GetClasses()
        => Ok(await _adminService.GetClassesAsync());

    [HttpPost("classes")]
    public async Task<IActionResult> CreateClass([FromBody] CreateClassRequestDto request)
    {
        await _adminService.CreateClassAsync(request);
        return Ok(new { success = true, message = "Sınıf oluşturuldu" });
    }

    [HttpPost("classes/courses")]
    public async Task<IActionResult> CreateCourse([FromBody] CreateCourseRequestDto request)
    {
        await _adminService.CreateCourseAsync(request);
        return Ok(new { success = true, message = "Ders oluşturuldu" });
    }

    [HttpGet("logs")]
    public async Task<IActionResult> GetLogs([FromQuery] int take = 20)
        => Ok(await _adminService.GetLogsAsync(take));

    [HttpGet("api-costs")]
    public async Task<IActionResult> GetApiCosts()
        => Ok(await _adminService.GetApiCostsAsync());

    [HttpGet("queue")]
    public async Task<IActionResult> GetQueue()
        => Ok(await _adminService.GetQueueAsync());
}
