using Serilog.Context;
using System.Security.Claims;

namespace CodexIQ.Api.Middlewares
{
    public class UserLogContextMiddleware
    {
        private readonly RequestDelegate _next;

        public UserLogContextMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var userName = "Anonim";
            var userRole = "Bilinmiyor";

            if (context.User.Identity?.IsAuthenticated == true)
            {
                var firstName = context.User.FindFirst("FirstName")?.Value
                    ?? context.User.FindFirst(ClaimTypes.GivenName)?.Value;
                var lastName = context.User.FindFirst("LastName")?.Value
                    ?? context.User.FindFirst(ClaimTypes.Surname)?.Value;

                if (!string.IsNullOrEmpty(firstName) || !string.IsNullOrEmpty(lastName))
                    userName = $"{firstName} {lastName}".Trim();
                else
                    userName = context.User.FindFirst(ClaimTypes.Name)?.Value
                        ?? context.User.FindFirst(ClaimTypes.Email)?.Value
                        ?? "Bilinmiyor";

                userRole = context.User.FindFirst(ClaimTypes.Role)?.Value ?? "Bilinmiyor";
            }

            using (LogContext.PushProperty("UserName", userName))
            using (LogContext.PushProperty("UserRole", userRole))
            {
                await _next(context);
            }
        }
    }
}
