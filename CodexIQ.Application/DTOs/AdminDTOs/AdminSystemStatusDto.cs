public class AdminSystemStatusDto
{
    public string ServiceName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public double UptimePercent { get; set; }
    public string Note { get; set; } = string.Empty;
}