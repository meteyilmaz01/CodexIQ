using CodexIQ.Application.Interfaces.CoreDataInterfaces;
using CodexIQ.Application.Interfaces.ExternalServices;
using CodexIQ.Application.Interfaces.Repositories;
using CodexIQ.Application.Interfaces.Services;
using CodexIQ.Application.Interfaces.Storage;
using CodexIQ.Application.Services;
using CodexIQ.Infrastructure.Authentication;
using CodexIQ.Infrastructure.Messaging;
using CodexIQ.Infrastructure.Persistence;
using CodexIQ.Infrastructure.Repository;
using CodexIQ.Infrastructure.Storage;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using CodexIQ.Infrastructure.RealTime;
using CodexIQ.Api.Middlewares;
using CodexIQ.Application.Validators.Auth;
using FluentValidation;
using Serilog;
using Serilog.Context;
using Serilog.Events;
using SharpGrip.FluentValidation.AutoValidation.Mvc.Extensions;
using System.Text;
using NpgsqlTypes;
using Serilog.Sinks.PostgreSQL;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("PostgreSqlConnection")!;

var columnWriters = new Dictionary<string, ColumnWriterBase>
{
    { "Message", new RenderedMessageColumnWriter() },
    { "Level", new LevelColumnWriter(true, NpgsqlDbType.Varchar) },
    { "TimeStamp", new TimestampColumnWriter() },
    { "Exception", new ExceptionColumnWriter() },
    { "Properties", new PropertiesColumnWriter() },
    { "UserName", new SinglePropertyColumnWriter("UserName", PropertyWriteMethod.Raw, NpgsqlDbType.Varchar) },
    { "UserRole", new SinglePropertyColumnWriter("UserRole", PropertyWriteMethod.Raw, NpgsqlDbType.Varchar) }
};


Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console(outputTemplate: "[{Timestamp:yyyy-MM-dd HH:mm:ss} {Level:u3}] [{UserName} ({UserRole})] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

builder.Host.UseSerilog();

builder.Services.AddDbContext<CodexIQDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("PostgreSqlConnection")));

builder.Services.AddMassTransit(x =>
{
    // Consumer'ı ekle
    x.AddConsumer<ExamResultConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host("localhost", "/", h => {
            h.Username("guest");
            h.Password("guest");
        });

        // Python'dan gelen sonuç kuyruğunu ayarla
        cfg.ReceiveEndpoint("exam-results-queue", e =>
        {
            e.UseRawJsonDeserializer();
            e.ConfigureConsumer<ExamResultConsumer>(context);
        });

    });
});


builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IStudentRepository, StudentRepository>();
builder.Services.AddScoped<IMessageRepository, MessageRepository>();
builder.Services.AddScoped<IMessageService, MessageService>();
builder.Services.AddScoped<IStudentService, StudentService>();
builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IJwtProvider, JwtProvider>();
builder.Services.AddScoped<ITeacherRepository, TeacherRepository>();
builder.Services.AddScoped<ITeacherService, TeacherService>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddScoped<IAdminRepository, AdminRepository>();
builder.Services.AddScoped<IAdminService, AdminService>();

builder.Services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();
builder.Services.AddFluentValidationAutoValidation(configuration =>
{
    configuration.DisableBuiltInModelValidation = true;
    configuration.OverrideDefaultResultFactoryWith<FluentValidationExceptionResultFactory>();
});

builder.Services.AddControllers();


builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:SecretKey"]!))
        };

        options.Events = new JwtBearerEvents
        {
            OnChallenge = async context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";

                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                logger.LogWarning("Yetkisiz erişim denemesi: {Path}", context.Request.Path);

                var json = System.Text.Json.JsonSerializer.Serialize(new
                {
                    success = false,
                    statusCode = 401,
                    message = "Yetkilendirme başarısız. Geçerli bir token ile giriş yapınız."
                });
                await context.Response.WriteAsync(json);
            },
            OnForbidden = async context =>
            {
                context.Response.StatusCode = 403;
                context.Response.ContentType = "application/json";

                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                logger.LogWarning("Yetkisiz rol erişimi: {Path}", context.Request.Path);

                var json = System.Text.Json.JsonSerializer.Serialize(new
                {
                    success = false,
                    statusCode = 403,
                    message = "Bu işlem için yetkiniz bulunmamaktadır."
                });
                await context.Response.WriteAsync(json);
            }
        };
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
builder.Services.AddSignalR();
builder.Services.AddScoped<IChatNotificationService, ChatNotificationService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); 
    });
});

var app = builder.Build();

// SignalR sink'i app build edildikten sonra ekliyoruz (IServiceProvider gerekli)
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console(outputTemplate: "[{Timestamp:yyyy-MM-dd HH:mm:ss} {Level:u3}] [{UserName} ({UserRole})] {Message:lj}{NewLine}{Exception}")
    .WriteTo.PostgreSQL(
        connectionString: connectionString,
        tableName: "Logs",
        columnOptions: columnWriters,
        needAutoCreateTable: false,
        respectCase: true)
    .WriteTo.Sink(new SignalRLogSink(app.Services))
    .CreateLogger();

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseCors("AllowFrontend");
app.UseAuthorization();

app.UseMiddleware<UserLogContextMiddleware>();

app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");
app.MapHub<LogHub>("/hubs/logs");

app.Run();
