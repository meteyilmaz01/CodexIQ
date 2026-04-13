using System;
using System.Collections.Generic;
using System.Text;

namespace CodexIQ.Application.DTOs.StudentsDTOs.StudentDashboardDTOS
{
    public class StatsDto
    {
        public double AverageScore { get; set; }   
        public int? LastScored { get; set; }

        public int TotalExamsTaken { get; set; }

        public int CodeTestCount { get; set; }
    }
}
