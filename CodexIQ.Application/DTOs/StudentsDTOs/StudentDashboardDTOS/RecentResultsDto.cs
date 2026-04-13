using System;
using System.Collections.Generic;
using System.Text;

namespace CodexIQ.Application.DTOs.StudentsDTOs.StudentDashboardDTOS
{
    public class RecentResultsDto
    {
        public Guid Id { get; set; }                    
        public string ExamName { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;  
        public DateTime UploadedAt { get; set; }
        public int FinalScore { get; set; }
        public string Status { get; set; } = string.Empty;    
    }

}
