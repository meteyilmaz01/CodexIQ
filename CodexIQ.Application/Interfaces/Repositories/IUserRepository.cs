using CodexIQ.Application.Interfaces.CoreDataInterfaces;
using CodexIQ.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace CodexIQ.Application.Interfaces.Repositories
{
    public interface IUserRepository : IRepository<User>
    {
        Task <User?> GetByEmailAsync(string email);
    }
}
