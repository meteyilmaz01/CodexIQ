public class CreateRegradeRequestDto
{
    public string Reason { get; set; } = string.Empty;
}

public class RegradeRequestStatusDto
{
    public Guid Id { get; set; }
    public string Status { get; set; } = string.Empty;  // "Pending" | "Approved" | "Rejected"
    public string? TeacherNote { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? ResolvedAt { get; set; }
}
