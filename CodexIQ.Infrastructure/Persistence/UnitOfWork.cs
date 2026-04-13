using CodexIQ.Application.Interfaces.CoreDataInterfaces;
using CodexIQ.Application.Interfaces.Repositories;
using System;
using System.Collections.Generic;
using System.Text;

namespace CodexIQ.Infrastructure.Persistence
{
    public class UnitOfWork : IUnitOfWork
    {

        private readonly CodexIQDbContext _context;
        public IUserRepository User { get; private set; }

        public IStudentRepository Student { get; private set; }
        public IMessageRepository Message { get; private set; }

        public ITeacherRepository Teacher { get; private set; }

        public IAdminRepository Admin { get; }

        public UnitOfWork(CodexIQDbContext context, 
            IUserRepository userRepository, 
            IStudentRepository studentRepository, 
            IMessageRepository messageRepository, 
            ITeacherRepository teacherRepository,
            IAdminRepository adminRepository)
        {
            _context = context;
            User = userRepository;
            Student = studentRepository;
            Message = messageRepository;
            Teacher = teacherRepository;
            Admin = adminRepository;
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}
