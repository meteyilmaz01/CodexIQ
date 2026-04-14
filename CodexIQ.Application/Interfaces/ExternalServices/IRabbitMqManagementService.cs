using CodexIQ.Application.DTOs.ExternalDTOs;

namespace CodexIQ.Application.Interfaces.ExternalServices
{
    public interface IRabbitMqManagementService
    {
        Task<List<RabbitMqQueueResponseDto>> GetQueuesAsync();
    }
}