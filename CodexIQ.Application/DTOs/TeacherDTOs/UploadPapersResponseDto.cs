public class UploadPapersResponseDto
{
    public int UploadedCount { get; set; }
    public List<string> FileNames { get; set; } = new();
}