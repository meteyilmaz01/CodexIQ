
public class TeacherResultDetailDto
{
    public Guid Id { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentNo { get; set; } = string.Empty;
    public string ExamName { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public string? CodePurpose { get; set; }
    public DateTime Date { get; set; }
    public int TotalScore { get; set; }
    public int OriginalScore { get; set; }
    public bool IsOverridden { get; set; }
    public bool IsShared { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? TeacherNote { get; set; }
    public List<CodeErrorDto> SyntaxErrors { get; set; } = new();
    public List<CodeErrorDto> LogicErrors { get; set; } = new();
    public List<ModelScoreDto> ModelScores { get; set; } = new();
    public List<RubricScoreDto> RubricScores { get; set; } = new();
}