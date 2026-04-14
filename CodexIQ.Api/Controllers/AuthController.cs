using CodexIQ.Application.DTOs.AuthDTOs;
using CodexIQ.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CodexIQ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        readonly IAuthService _authService;
        readonly ILogger<AuthController> _logger;

        public AuthController(IAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            var response = await _authService.LoginAsync(request);
            _logger.LogInformation("Login başarılı: {Email}", request.Email);
            return Ok(new { success = true, data = response });
        }

        [HttpPut("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request)
        {
            var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
            await _authService.ChangePasswordAsync(userId, request);
            _logger.LogInformation("Şifre değiştirildi");
            return Ok(new { success = true, message = "Şifre değiştirildi" });
        }
    }
}
