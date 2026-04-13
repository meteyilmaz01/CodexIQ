using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CodexIQ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        // 1. Sadece "Student" rolüne sahip olanlar girebilir
        [Authorize(Roles = "Student")]
        [HttpGet("student-only")]
        public IActionResult GetStudentData()
        {
            // İçeri girmeyi başaran kişinin token'ı içindeki bilgileri okuyoruz
            var email = User.FindFirstValue(ClaimTypes.Email);
            var role = User.FindFirstValue(ClaimTypes.Role);
            var firstName = User.FindFirstValue("FirstName");

            return Ok(new
            {
                Message = $"Tebrikler {firstName}! Bu gizli alana sadece Öğrenciler girebilir. Token'ın başarıyla doğrulandı.",
                Email = email,
                Role = role
            });
        }

        // 2. Sisteme giriş yapmış HERKES girebilir (Rol fark etmez)
        [Authorize]
        [HttpGet("all-authenticated")]
        public IActionResult GetAllUsersData()
        {
            return Ok(new { Message = "Sisteme giriş yapmış geçerli bir kullanıcısın." });
        }

        // 3. Herkese açık (Token gerekmez)
        [AllowAnonymous]
        [HttpGet("public")]
        public IActionResult GetPublicData()
        {
            return Ok(new { Message = "Burası herkese açık, token'a gerek yok!" });
        }
    }
}