using Microsoft.AspNetCore.Http;

namespace CodexIQ.Application.Interfaces.Storage
{
    public interface IFileStorageService
    {
        /// <summary>IFormFile'ı belirtilen klasöre kaydeder. Relatif path döndürür.</summary>
        Task<string> SaveFileAsync(IFormFile file, string folder);

        /// <summary>Ham byte dizisini belirtilen klasöre kaydeder. Relatif path döndürür.</summary>
        Task<string> SaveBytesAsync(byte[] data, string folder, string fileName);

        /// <summary>
        /// PDF dosyasını sayfalara böler, her sayfayı JPEG olarak kaydeder.
        /// Dönen liste her sayfanın relatif path'ini içerir.
        /// </summary>
        Task<List<string>> SavePdfPagesAsync(byte[] pdfData, string folder);

        Task<byte[]> ReadFileAsync(string filePath);
        void DeleteFile(string filePath);
    }
}
