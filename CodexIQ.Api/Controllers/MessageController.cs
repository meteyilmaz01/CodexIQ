
using CodexIQ.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/messages")]
[Authorize]
public class MessageController : ControllerBase
{
    private readonly IMessageService _messageService;

    public MessageController(IMessageService messageService)
    {
        _messageService = messageService;
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    [HttpGet("teachers")]
    public async Task<IActionResult> GetTeachers()
    {
        var result = await _messageService.GetTeachersAsync(GetUserId());
        return Ok(result);
    }

    [HttpGet("{teacherId}")]
    public async Task<IActionResult> GetConversation(Guid teacherId)
    {
        var result = await _messageService.GetConversationAsync(GetUserId(), teacherId);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageRequestDto request)
    {
        await _messageService.SendMessageAsync(GetUserId(), request);
        return Ok(new { success = true, message = "Mesaj gönderildi" });
    }

    [HttpPut("{messageId}/read")]
    public async Task<IActionResult> MarkAsRead(Guid messageId)
    {
        await _messageService.MarkAsReadAsync(GetUserId(), messageId);
        return Ok(new { success = true });
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var result = await _messageService.GetUnreadCountAsync(GetUserId());
        return Ok(result);
    }

    [HttpGet("students")]
    public async Task<IActionResult> GetStudents()
    {
        var result = await _messageService.GetStudentsAsync(GetUserId());
        return Ok(result);
    }
}