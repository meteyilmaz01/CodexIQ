using Microsoft.AspNetCore.SignalR;
using Serilog.Core;
using Serilog.Events;

namespace CodexIQ.Infrastructure.RealTime
{
    public class SignalRLogSink : ILogEventSink
    {
        private readonly IServiceProvider _serviceProvider;

        public SignalRLogSink(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        public void Emit(LogEvent logEvent)
        {
            try
            {
                var hubContext = _serviceProvider.GetService(typeof(IHubContext<LogHub>)) as IHubContext<LogHub>;
                if (hubContext == null) return;

                var userName = logEvent.Properties.TryGetValue("UserName", out var userNameProp)
                    ? userNameProp.ToString().Trim('"')
                    : "Sistem";

                var userRole = logEvent.Properties.TryGetValue("UserRole", out var userRoleProp)
                    ? userRoleProp.ToString().Trim('"')
                    : "";

                var logEntry = new
                {
                    message = logEvent.RenderMessage(),
                    level = logEvent.Level.ToString(),
                    timeStamp = logEvent.Timestamp.UtcDateTime,
                    userName = userName,
                    userRole = userRole,
                    exception = logEvent.Exception?.Message
                };

                hubContext.Clients
                    .Group("AdminLogViewers")
                    .SendAsync("ReceiveLog", logEntry)
                    .ConfigureAwait(false);
            }
            catch
            {
                // Sink hataları uygulamayı kırmamalı
            }
        }
    }
}
