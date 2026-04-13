public class RecentUploadDto
{
    public Guid Id { get; set; }
    public string ExamName { get; set; } = string.Empty;
    public int PaperCount { get; set; }
    public DateTime Date { get; set; }
    public string Status { get; set; } = string.Empty;
}