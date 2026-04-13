// Application/DTOs/StudentsDTOs/ExamResultDTOs/ExamResultDetailDto.cs

public class ExamResultDetailDto
{
    public Guid Id { get; set; }
    public string ExamName { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public string? CodePurpose { get; set; }
    public DateTime Date { get; set; }
    public int TotalScore { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? TeacherNote { get; set; }
    public List<CodeErrorDto> SyntaxErrors { get; set; } = new();
    public List<CodeErrorDto> LogicErrors { get; set; } = new();
    public List<ModelScoreDto> ModelScores { get; set; } = new();
}