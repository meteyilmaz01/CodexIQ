public class StudentErrorSummaryDto
{
    public int SyntaxErrorCount { get; set; }
    public int LogicErrorCount { get; set; }
    public List<string> TopSyntaxErrors { get; set; } = new();
    public List<string> TopLogicErrors { get; set; } = new();
}
