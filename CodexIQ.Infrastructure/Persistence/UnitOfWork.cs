using CodexIQ.Application.Interfaces.CoreDataInterfaces;
using CodexIQ.Application.Interfaces.Repositories;
using CodexIQ.Infrastructure.Repository;

namespace CodexIQ.Infrastructure.Persistence
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly CodexIQDbContext _context;

        private IUserRepository? _user;
        private IStudentRepository? _student;
        private IMessageRepository? _message;
        private ITeacherRepository? _teacher;
        private IAdminRepository? _admin;
        private IStudentInsightRepository? _studentInsight;

        public IUserRepository User => _user ??= new UserRepository(_context);
        public IStudentRepository Student => _student ??= new StudentRepository(_context);
        public IMessageRepository Message => _message ??= new MessageRepository(_context);
        public ITeacherRepository Teacher => _teacher ??= new TeacherRepository(_context);
        public IAdminRepository Admin => _admin ??= new AdminRepository(_context);
        public IStudentInsightRepository StudentInsight => _studentInsight ??= new StudentInsightRepository(_context);

        public UnitOfWork(CodexIQDbContext context)
        {
            _context = context;
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}
