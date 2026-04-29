public class ExamSummaryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public int PaperCount { get; set; }
    public DateTime CreatedDate { get; set; }
}
