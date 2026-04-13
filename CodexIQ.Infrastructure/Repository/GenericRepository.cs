using CodexIQ.Application.Interfaces.CoreDataInterfaces;
using CodexIQ.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace CodexIQ.Infrastructure.Repository
{
    public class GenericRepository<T> : IRepository<T> where T : class
    {
        protected readonly CodexIQDbContext _context;
        protected readonly DbSet<T> _dbSet;

        public GenericRepository(CodexIQDbContext context)
        {
            _context = context;
            _dbSet = _context.Set<T>();
        }
        public async Task AddAsync(T entity)
        {
            await _dbSet.AddAsync(entity);
        }

        public void Delete(T entity)
        {
            _dbSet.Remove(entity);
        }

        public async Task<T?> GetByIdAsync(Guid id)
        {
            return await _dbSet.FindAsync(id);
        }

        public void Update(T entity)
        {
            _dbSet.Update(entity);
        }
    }
}
