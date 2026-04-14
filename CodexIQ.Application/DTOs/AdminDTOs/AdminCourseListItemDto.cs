using System;

namespace CodexIQ.Application.DTOs.AdminDTOs
{
    public class AdminCourseListItemDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public Guid ClassId { get; set; }

        // EKLENEN SATIR: Hata veren ClassName özelliği eklendi
        public string ClassName { get; set; } = string.Empty;

        public DateTime CreatedDate { get; set; }
    }
}