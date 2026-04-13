public class AdminDashboardDto
{
    public int TotalUsers { get; set; }
    public int TotalTeachers { get; set; }
    public int TotalStudents { get; set; }
    public decimal DailyApiCost { get; set; }
    public int ActiveCourses { get; set; }
    public int ActiveClasses { get; set; }
    public int ExamsThisMonth { get; set; }
    public int AnnouncementCount { get; set; }
    public List<AdminApiCostItemDto> ApiUsage { get; set; } = new();
    public List<AdminSystemStatusDto> SystemStatuses { get; set; } = new();
    public List<AdminActivityDto> RecentActivities { get; set; } = new();
}