using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using CodexIQ.Application.DTOs.ExternalDTOs;
using CodexIQ.Application.Interfaces.ExternalServices;
using Microsoft.Extensions.Configuration;

namespace CodexIQ.Infrastructure.ExternalServices
{
    public class RabbitMqManagementService : IRabbitMqManagementService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public RabbitMqManagementService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<List<RabbitMqQueueResponseDto>> GetQueuesAsync()
        {
            var baseUrl = _configuration["RabbitMqManagement:BaseUrl"] ?? "http://localhost:15672";
            var username = _configuration["RabbitMqManagement:Username"] ?? "guest";
            var password = _configuration["RabbitMqManagement:Password"] ?? "guest";

            var authString = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{username}:{password}"));
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", authString);

            try
            {
                var response = await _httpClient.GetAsync($"{baseUrl}/api/queues");
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var queues = JsonSerializer.Deserialize<List<RabbitMqQueueResponseDto>>(content)
                             ?? new List<RabbitMqQueueResponseDto>();

                return queues;
            }
            catch (Exception)
            {
                return new List<RabbitMqQueueResponseDto>();
            }
        }
    }
}