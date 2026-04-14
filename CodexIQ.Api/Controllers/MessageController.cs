
using CodexIQ.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/messages")]
[Authorize]
public class MessageController : ControllerBase
{
    private readonly IMessageService _messageService;
    private readonly ILogger<MessageController> _logger;

    public MessageController(IMessageService messageService, ILogger<MessageController> logger)
    {
        _messageService = messageService;
        _logger = logger;
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    [HttpGet("teachers")]
    public async Task<IActionResult> GetTeachers()
    {
        _logger.LogInformation("Öğretmen listesi görüntülendi");
        var result = await _messageService.GetTeachersAsync(GetUserId());
        return Ok(result);
    }

    [HttpGet("{teacherId}")]
    public async Task<IActionResult> GetConversation(Guid teacherId)
    {
        _logger.LogInformation("Konuşma görüntülendi (KarşıTaraf: {OtherId})", teacherId);
        var result = await _messageService.GetConversationAsync(GetUserId(), teacherId);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageRequestDto request)
    {
        await _messageService.SendMessageAsync(GetUserId(), request);
        _logger.LogInformation("Mesaj gönderildi (Alıcı: {ReceiverId})", request.ReceiverId);
        return Ok(new { success = true, message = "Mesaj gönderildi" });
    }

    [HttpPut("{messageId}/read")]
    public async Task<IActionResult> MarkAsRead(Guid messageId)
    {
        await _messageService.MarkAsReadAsync(GetUserId(), messageId);
        _logger.LogInformation("Mesaj okundu olarak işaretlendi (MessageId: {MessageId})", messageId);
        return Ok(new { success = true });
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        _logger.LogInformation("Okunmamış mesaj sayısı sorgulandı");
        var result = await _messageService.GetUnreadCountAsync(GetUserId());
        return Ok(result);
    }

    [HttpGet("students")]
    public async Task<IActionResult> GetStudents()
    {
        _logger.LogInformation("Öğrenci listesi görüntülendi (mesajlaşma)");
        var result = await _messageService.GetStudentsAsync(GetUserId());
        return Ok(result);
    }
}
