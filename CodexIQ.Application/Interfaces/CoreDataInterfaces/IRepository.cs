using System;
using System.Collections.Generic;
using System.Text;

namespace CodexIQ.Application.Interfaces.CoreDataInterfaces
{
    public interface IRepository<T> where T : class
    {
        Task<T?> GetByIdAsync(Guid id);
        Task AddAsync(T entity);
        void Delete(T entity);
        void Update(T entity);
    }
}
