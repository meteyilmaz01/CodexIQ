using CodexIQ.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CodexIQ.Infrastructure.Persistence
{
    public class CodexIQDbContext : DbContext
    {
        public CodexIQDbContext(DbContextOptions<CodexIQDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Class> Classrooms { get; set; } 
        public DbSet<StudentClass> StudentClasses { get; set; }
        public DbSet<Course> Courses { get; set; }
        public DbSet<Exam> Exams { get; set; }
        public DbSet<ExamPaper> ExamPapers { get; set; }
        public DbSet<ExtractedCode> ExtractedCodes { get; set; }
        public DbSet<AIModelResult> AIModelResults { get; set; }
        public DbSet<FinalEvaluation> FinalEvaluations { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Announcement> Announcements { get; set; }

        public DbSet<RubricCriteria> RubricCriterias { get; set; }
        public DbSet<Log> Logs { get; set; }
        public DbSet<RegradeRequest> RegradeRequests { get; set; }
        public DbSet<StudentInsight> StudentInsights { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Message>()
                .HasOne(m => m.Sender)
                .WithMany(u => u.SentMessages)
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict); 

            modelBuilder.Entity<Message>()
                .HasOne(m => m.Receiver)
                .WithMany(u => u.ReceivedMessages)
                .HasForeignKey(m => m.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Announcement>()
                .HasOne(a => a.Creator)
                .WithMany()
                .HasForeignKey(a => a.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<RegradeRequest>()
                .HasOne(r => r.Student)
                .WithMany()
                .HasForeignKey(r => r.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<RegradeRequest>()
                .HasOne(r => r.Teacher)
                .WithMany()
                .HasForeignKey(r => r.TeacherId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<RegradeRequest>()
                .HasOne(r => r.ExamPaper)
                .WithMany()
                .HasForeignKey(r => r.ExamPaperId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Log>(entity =>
            {
                entity.ToTable("Logs");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.Message).HasColumnType("text");
                entity.Property(e => e.Level).HasMaxLength(50);
                entity.Property(e => e.Exception).HasColumnType("text");
                entity.Property(e => e.Properties).HasColumnType("text");
                entity.Property(e => e.UserName).HasMaxLength(200);
                entity.Property(e => e.UserRole).HasMaxLength(50);
            });
        }
    }
}