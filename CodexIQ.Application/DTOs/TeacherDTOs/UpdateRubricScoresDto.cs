public class UpdateRubricScoresDto
{
    public List<RubricScoreItemDto> Items { get; set; } = new();
}

public class RubricScoreItemDto
{
    public string Criteria { get; set; } = string.Empty;
    public int MaxPoints { get; set; }
    public int EarnedPoints { get; set; }
}
