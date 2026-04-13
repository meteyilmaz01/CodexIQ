using CodexIQ.Application.Interfaces.Repositories;
using System;
using System.Collections.Generic;
using System.Text;

namespace CodexIQ.Application.Interfaces.CoreDataInterfaces
{
    public interface IUnitOfWork: IDisposable
    {
        IUserRepository User { get; }
        IStudentRepository Student { get; }

        IMessageRepository Message { get; }

        ITeacherRepository Teacher { get; }

        IAdminRepository Admin { get; }

        Task<int> SaveChangesAsync();
    }
}
