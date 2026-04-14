using CodexIQ.Application.Exceptions;
using System.Net;
using System.Text.Json;

namespace CodexIQ.Api.Middlewares
{
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;

        public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            var (statusCode, response) = exception switch
            {
                NotFoundException ex => (
                    HttpStatusCode.NotFound,
                    new ErrorResponse
                    {
                        Success = false,
                        StatusCode = (int)HttpStatusCode.NotFound,
                        Message = ex.Message
                    }),

                Application.Exceptions.ValidationException ex => (
                    HttpStatusCode.BadRequest,
                    new ErrorResponse
                    {
                        Success = false,
                        StatusCode = (int)HttpStatusCode.BadRequest,
                        Message = ex.Message,
                        Errors = ex.Errors
                    }),

                UnauthorizedException ex => (
                    HttpStatusCode.Unauthorized,
                    new ErrorResponse
                    {
                        Success = false,
                        StatusCode = (int)HttpStatusCode.Unauthorized,
                        Message = ex.Message
                    }),

                ForbiddenException ex => (
                    HttpStatusCode.Forbidden,
                    new ErrorResponse
                    {
                        Success = false,
                        StatusCode = (int)HttpStatusCode.Forbidden,
                        Message = ex.Message
                    }),

                BusinessException ex => (
                    HttpStatusCode.UnprocessableEntity,
                    new ErrorResponse
                    {
                        Success = false,
                        StatusCode = (int)HttpStatusCode.UnprocessableEntity,
                        Message = ex.Message
                    }),

                _ => (
                    HttpStatusCode.InternalServerError,
                    new ErrorResponse
                    {
                        Success = false,
                        StatusCode = (int)HttpStatusCode.InternalServerError,
                        Message = "Beklenmeyen bir hata oluştu"
                    })
            };

            // Loglama: 4xx -> Warning, 5xx -> Error
            if (statusCode == HttpStatusCode.InternalServerError)
                _logger.LogError(exception, "Beklenmeyen hata: {Message}", exception.Message);
            else
                _logger.LogWarning("İş kuralı hatası: {ExceptionType} - {Message}", exception.GetType().Name, exception.Message);

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)statusCode;

            var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            var json = JsonSerializer.Serialize(response, jsonOptions);
            await context.Response.WriteAsync(json);
        }
    }

    public class ErrorResponse
    {
        public bool Success { get; set; }
        public int StatusCode { get; set; }
        public string Message { get; set; } = string.Empty;
        public List<string>? Errors { get; set; }
    }
}
