using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace CodexIQ.Infrastructure.RealTime
{
    [Authorize(Roles = "Admin")]
    public class LogHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "AdminLogViewers");
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, "AdminLogViewers");
            await base.OnDisconnectedAsync(exception);
        }
    }
}
