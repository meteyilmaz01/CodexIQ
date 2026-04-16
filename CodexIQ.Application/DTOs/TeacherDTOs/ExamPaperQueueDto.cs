/// <summary>
/// StartEvaluationAsync'in döndürdüğü DTO.
/// Controller bu listeyi kullanarak her kağıt için ayrı EvaluateExamCommand gönderir.
/// </summary>
public class ExamPaperQueueDto
{
    public Guid PaperId { get; set; }
    public string ImagePath { get; set; } = string.Empty;
    public string TeacherContext { get; set; } = string.Empty;
    public string ProgrammingLanguage { get; set; } = string.Empty;
}
