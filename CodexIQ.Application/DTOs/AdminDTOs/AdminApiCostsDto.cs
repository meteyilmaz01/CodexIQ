public class AdminApiCostsDto
{
    public decimal DailyTotalCost { get; set; }
    public List<AdminApiCostItemDto> Items { get; set; } = new();
}