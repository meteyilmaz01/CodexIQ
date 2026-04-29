public class TopExamErrorDto
{
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // "Syntax" | "Logic"
    public int Count { get; set; }
}
