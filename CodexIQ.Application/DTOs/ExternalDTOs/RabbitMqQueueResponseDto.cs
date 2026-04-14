using System.Text.Json.Serialization;

namespace CodexIQ.Application.DTOs.ExternalDTOs
{
    public class RabbitMqQueueResponseDto
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("messages_ready")]
        public int MessagesReady { get; set; }

        [JsonPropertyName("messages_unacknowledged")]
        public int MessagesUnacknowledged { get; set; }

        [JsonPropertyName("messages")]
        public int Messages { get; set; }

        [JsonPropertyName("state")]
        public string State { get; set; } = string.Empty;
    }
}