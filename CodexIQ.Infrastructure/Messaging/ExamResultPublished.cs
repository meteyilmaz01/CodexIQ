using System.Text.Json.Serialization;

namespace CodexIQ.Infrastructure.Messaging
{
    /// <summary>
    /// Python worker'ın exam-results-queue'ya gönderdiği mesaj formatı.
    /// Her mesaj tek bir ExamPaper'ın sonucunu içerir.
    /// camelCase → PascalCase: MassTransit UseRawJsonDeserializer ile case-insensitive eşleme yapar.
    /// Türkçe alt çizgili alanlar için [JsonPropertyName] kullanılır.
    /// </summary>
    public class ExamResultPublished
    {
        public Guid ExamPaperId { get; set; }
        public Guid ExamId { get; set; }
        public StudentInfoMessage StudentInfo { get; set; } = new();
        public string ExtractedCode { get; set; } = string.Empty;
        public EvaluationMessage Evaluation { get; set; } = new();
        public ModelScoresMessage ModelScores { get; set; } = new();
        public string Status { get; set; } = string.Empty;
    }

    public class StudentInfoMessage
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string StudentNumber { get; set; } = string.Empty;
    }

    public class EvaluationMessage
    {
        [JsonPropertyName("toplam_puan")]
        public int ToplamPuan { get; set; }

        [JsonPropertyName("syntax_hatalari")]
        public List<HataDetayiMessage> SyntaxHatalari { get; set; } = new();

        [JsonPropertyName("mantik_hatalari")]
        public List<HataDetayiMessage> MantikHatalari { get; set; } = new();

        [JsonPropertyName("hakem_ozeti")]
        public string HakemOzeti { get; set; } = string.Empty;

        [JsonPropertyName("gelisim_alanlari")]
        public List<GelisimAlaniMessage> GelisimAlanlari { get; set; } = new();

        [JsonPropertyName("genel_degerlendirme")]
        public string GenelDegerlendirme { get; set; } = string.Empty;
    }

    public class HataDetayiMessage
    {
        [JsonPropertyName("satir")]
        public string Satir { get; set; } = string.Empty;

        [JsonPropertyName("hata_turu")]
        public string HataTuru { get; set; } = string.Empty;

        [JsonPropertyName("severity")]
        public string Severity { get; set; } = string.Empty;

        [JsonPropertyName("aciklama")]
        public string Aciklama { get; set; } = string.Empty;

        [JsonPropertyName("hint")]
        public string Hint { get; set; } = string.Empty;
    }

    public class GelisimAlaniMessage
    {
        [JsonPropertyName("konu")]
        public string Konu { get; set; } = string.Empty;

        [JsonPropertyName("mevcut_seviye")]
        public int MevcutSeviye { get; set; }

        [JsonPropertyName("oneri")]
        public string Oneri { get; set; } = string.Empty;
    }

    public class ModelScoresMessage
    {
        public int Gemini { get; set; }

        [JsonPropertyName("groq_llama")]
        public int GroqLlama { get; set; }

        [JsonPropertyName("ollama_llama")]
        public int OllamaLlama { get; set; }
    }
}
