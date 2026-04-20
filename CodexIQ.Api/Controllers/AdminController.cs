using CodexIQ.Application.DTOs.AdminDTOs;
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
    private readonly ILogger<AdminController> _logger;

    public AdminController(IAdminService adminService, ILogger<AdminController> logger)
    {
        _adminService = adminService;
        _logger = logger;
    }

    private Guid GetUserId()
        => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        _logger.LogInformation("Admin dashboard görüntülendi");
        return Ok(await _adminService.GetDashboardAsync());
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search,
        [FromQuery] UserRole? role,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        _logger.LogInformation("Kullanıcı listesi görüntülendi (Sayfa: {Page}, Rol: {Role})", page, role?.ToString() ?? "Tümü");
        return Ok(await _adminService.GetUsersAsync(search, role, isActive, page, pageSize));
    }

    [HttpPatch("users/{id:guid}/status")]
    public async Task<IActionResult> UpdateUserStatus(Guid id, [FromBody] UpdateUserStatusRequestDto request)
    {
        await _adminService.UpdateUserStatusAsync(id, request.IsActive);
        _logger.LogInformation("Kullanıcı durumu güncellendi: {Status} (UserId: {Id})", request.IsActive ? "Aktif" : "Pasif", id);
        return Ok(new { success = true, message = "Kullanıcı durumu güncellendi" });
    }

    [HttpGet("announcements")]
    public async Task<IActionResult> GetAnnouncements()
    {
        _logger.LogInformation("Duyurular listelendi");
        return Ok(await _adminService.GetAnnouncementsAsync());
    }

    [HttpPost("announcements")]
    public async Task<IActionResult> CreateAnnouncement([FromBody] CreateAnnouncementRequestDto request)
    {
        await _adminService.CreateAnnouncementAsync(GetUserId(), request);
        _logger.LogInformation("Duyuru oluşturuldu: {Title}", request.Title);
        return Ok(new { success = true, message = "Duyuru oluşturuldu" });
    }

    [HttpPut("announcements/{id:guid}")]
    public async Task<IActionResult> UpdateAnnouncement(Guid id, [FromBody] UpdateAnnouncementRequestDto request)
    {
        await _adminService.UpdateAnnouncementAsync(id, request);
        _logger.LogInformation("Duyuru güncellendi (AnnouncementId: {Id})", id);
        return Ok(new { success = true, message = "Duyuru güncellendi" });
    }

    [HttpDelete("announcements/{id:guid}")]
    public async Task<IActionResult> DeleteAnnouncement(Guid id)
    {
        await _adminService.DeleteAnnouncementAsync(id);
        _logger.LogWarning("Duyuru silindi (AnnouncementId: {Id})", id);
        return Ok(new { success = true, message = "Duyuru silindi" });
    }

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequestDto request)
    {
        await _adminService.CreateUserAsync(request);
        _logger.LogInformation("Admin tarafından yeni kullanıcı oluşturuldu: {Email}", request.Email);
        return Ok(new { success = true, message = "Kullanıcı başarıyla oluşturuldu" });
    }

    [HttpPut("users/{id:guid}")]
    public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserRequestDto request)
    {
        await _adminService.UpdateUserAsync(id, request);
        _logger.LogInformation("Kullanıcı güncellendi (UserId: {Id})", id);
        return Ok(new { success = true, message = "Kullanıcı başarıyla güncellendi" });
    }

    [HttpDelete("users/{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        await _adminService.DeleteUserAsync(id);
        _logger.LogWarning("Kullanıcı silindi (UserId: {Id})", id);
        return Ok(new { success = true, message = "Kullanıcı başarıyla silindi" });
    }

    [HttpGet("classes")]
    public async Task<IActionResult> GetClasses()
    {
        _logger.LogInformation("Sınıf listesi görüntülendi");
        return Ok(await _adminService.GetClassesAsync());
    }

    [HttpPost("classes")]
    public async Task<IActionResult> CreateClass([FromBody] CreateClassRequestDto request)
    {
        await _adminService.CreateClassAsync(request);
        _logger.LogInformation("Sınıf oluşturuldu: {ClassName}", request.Name);
        return Ok(new { success = true, message = "Sınıf oluşturuldu" });
    }

    [HttpPost("classes/courses")]
    public async Task<IActionResult> CreateCourse([FromBody] CreateCourseRequestDto request)
    {
        await _adminService.CreateCourseAsync(request);
        _logger.LogInformation("Ders oluşturuldu: {CourseName}", request.Name);
        return Ok(new { success = true, message = "Ders oluşturuldu" });
    }

    [HttpPut("classes/{id:guid}")]
    public async Task<IActionResult> UpdateClass(Guid id, [FromBody] UpdateClassRequestDto request)
    {
        await _adminService.UpdateClassAsync(id, request);
        _logger.LogInformation("Sınıf güncellendi: {ClassName} (Id: {Id})", request.Name, id);
        return Ok(new { success = true, message = "Sınıf güncellendi" });
    }

    [HttpPatch("classes/{id:guid}/status")]
    public async Task<IActionResult> UpdateClassStatus(Guid id, [FromBody] UpdateClassStatusRequestDto request)
    {
        await _adminService.UpdateClassStatusAsync(id, request.IsActive);
        _logger.LogInformation("Sınıf durumu güncellendi: {Status} (Id: {Id})", request.IsActive ? "Aktif" : "Pasif", id);
        return Ok(new { success = true, message = "Sınıf durumu güncellendi" });
    }

    [HttpDelete("classes/{id:guid}")]
    public async Task<IActionResult> DeleteClass(Guid id)
    {
        await _adminService.DeleteClassAsync(id);
        _logger.LogWarning("Sınıf silindi (Id: {Id})", id);
        return Ok(new { success = true, message = "Sınıf silindi" });
    }

    [HttpGet("courses")]
    public async Task<IActionResult> GetCourses(
        [FromQuery] string? search,
        [FromQuery] Guid? classId,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        _logger.LogInformation("Ders listesi görüntülendi");
        return Ok(await _adminService.GetCoursesAsync(search, classId, isActive, page, pageSize));
    }

    [HttpPut("courses/{id:guid}")]
    public async Task<IActionResult> UpdateCourse(Guid id, [FromBody] UpdateCourseRequestDto request)
    {
        await _adminService.UpdateCourseAsync(id, request);
        _logger.LogInformation("Ders güncellendi: {CourseName} (Id: {Id})", request.Name, id);
        return Ok(new { success = true, message = "Ders güncellendi" });
    }

    [HttpPatch("courses/{id:guid}/status")]
    public async Task<IActionResult> UpdateCourseStatus(Guid id, [FromBody] UpdateCourseStatusRequestDto request)
    {
        await _adminService.UpdateCourseStatusAsync(id, request.IsActive);
        _logger.LogInformation("Ders durumu güncellendi: {Status} (Id: {Id})", request.IsActive ? "Aktif" : "Pasif", id);
        return Ok(new { success = true, message = "Ders durumu güncellendi" });
    }

    [HttpDelete("courses/{id:guid}")]
    public async Task<IActionResult> DeleteCourse(Guid id)
    {
        await _adminService.DeleteCourseAsync(id);
        _logger.LogWarning("Ders silindi (Id: {Id})", id);
        return Ok(new { success = true, message = "Ders silindi" });
    }

    [HttpGet("logs")]
    public async Task<IActionResult> GetLogs([FromQuery] int take = 20)
    {
        _logger.LogInformation("Log kayıtları görüntülendi (Take: {Take})", take);
        return Ok(await _adminService.GetLogsAsync(take));
    }

    [HttpGet("api-costs")]
    public async Task<IActionResult> GetApiCosts()
    {
        _logger.LogInformation("API maliyetleri görüntülendi");
        return Ok(await _adminService.GetApiCostsAsync());
    }

    [HttpGet("queue")]
    public async Task<IActionResult> GetQueue()
    {
        _logger.LogInformation("Kuyruk durumu görüntülendi");
        return Ok(await _adminService.GetQueueAsync());
    }

    [HttpGet("classes/{classId:guid}/students")]
    public async Task<IActionResult> GetClassStudents(Guid classId)
    {
        _logger.LogInformation("Sınıf öğrencileri görüntülendi (ClassId: {ClassId})", classId);
        return Ok(await _adminService.GetStudentsByClassIdAsync(classId));
    }

    [HttpPost("classes/{classId:guid}/students")]
    public async Task<IActionResult> AssignStudents(Guid classId, [FromBody] AssignStudentsRequestDto request)
    {
        await _adminService.AssignStudentsToClassAsync(classId, request);
        _logger.LogInformation("{Count} öğrenci sınıfa atandı (ClassId: {ClassId})", request.StudentIds.Count, classId);
        return Ok(new { success = true, message = $"{request.StudentIds.Count} öğrenci sınıfa atandı" });
    }

    [HttpDelete("classes/{classId:guid}/students/{studentId:guid}")]
    public async Task<IActionResult> RemoveStudentFromClass(Guid classId, Guid studentId)
    {
        await _adminService.RemoveStudentFromClassAsync(classId, studentId);
        _logger.LogWarning("Öğrenci sınıftan çıkarıldı (ClassId: {ClassId}, StudentId: {StudentId})", classId, studentId);
        return Ok(new { success = true, message = "Öğrenci sınıftan çıkarıldı" });
    }
}
