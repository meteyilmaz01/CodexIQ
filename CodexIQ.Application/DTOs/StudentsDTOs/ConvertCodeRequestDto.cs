public class ConvertCodeRequestDto
{
    /// <summary>Base64-encoded görsel (data:image/... prefix dahil)</summary>
    public string ImageBase64 { get; set; } = string.Empty;
    public string Language { get; set; } = "unknown";
}
