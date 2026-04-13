using Microsoft.AspNetCore.Http;

namespace CodexIQ.Application.Interfaces.Storage
{
    public interface IFileStorageService
    {
        Task<string> SaveFileAsync(IFormFile file, string folder);
        Task<byte[]> ReadFileAsync(string filePath);
        void DeleteFile(string filePath);
    }
}