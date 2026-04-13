
public class CodeErrorDto
{
    public int Line { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string Hint { get; set; } = string.Empty;
}