
using CodexIQ.Application.Interfaces.Storage;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using PDFtoImage;
using SkiaSharp;

namespace CodexIQ.Infrastructure.Storage
{
    public class FileStorageService : IFileStorageService
    {
        private readonly string _basePath;

        public FileStorageService(IConfiguration configuration)
        {
            _basePath = configuration["FileStorage:BasePath"]
                        ?? Path.Combine(Directory.GetCurrentDirectory(), "Uploads");

            if (!Directory.Exists(_basePath))
                Directory.CreateDirectory(_basePath);
        }

        public async Task<string> SaveFileAsync(IFormFile file, string folder)
        {
            var folderPath = Path.Combine(_basePath, folder);
            if (!Directory.Exists(folderPath))
                Directory.CreateDirectory(folderPath);

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(folderPath, fileName);

            using var stream = new FileStream(filePath, FileMode.Create);
            await file.CopyToAsync(stream);

            return Path.Combine(folder, fileName);
        }

        public async Task<string> SaveBytesAsync(byte[] data, string folder, string fileName)
        {
            var folderPath = Path.Combine(_basePath, folder);
            if (!Directory.Exists(folderPath))
                Directory.CreateDirectory(folderPath);

            var fullPath = Path.Combine(folderPath, fileName);
            await File.WriteAllBytesAsync(fullPath, data);

            return Path.Combine(folder, fileName);
        }

        /// <summary>
        /// PDF dosyasını sayfalara böler, her sayfayı ayrı JPEG olarak kaydeder.
        /// Her sayfa = bir öğrencinin sınav kağıdı olarak işlenir.
        /// </summary>
        public async Task<List<string>> SavePdfPagesAsync(byte[] pdfData, string folder)
        {
            var savedPaths = new List<string>();

            var folderPath = Path.Combine(_basePath, folder);
            if (!Directory.Exists(folderPath))
                Directory.CreateDirectory(folderPath);

            using var pdfStream = new MemoryStream(pdfData);

            // PDF'nin her sayfasını SKBitmap olarak al (300 DPI kalitesi)
            var renderOptions = new RenderOptions(Dpi: 200);
            int pageIndex = 0;

            foreach (var bitmap in Conversion.ToImages(pdfStream, options: renderOptions))
            {
                using (bitmap)
                {
                    // JPEG olarak encode et
                    using var encoded = bitmap.Encode(SKEncodedImageFormat.Jpeg, 92);
                    var jpegBytes = encoded.ToArray();

                    // Sayfa dosya adı: guid_sayfa{N}.jpg
                    var fileName = $"{Guid.NewGuid()}_page{pageIndex + 1}.jpg";
                    var fullPath = Path.Combine(folderPath, fileName);

                    await File.WriteAllBytesAsync(fullPath, jpegBytes);

                    var relativePath = Path.Combine(folder, fileName);
                    savedPaths.Add(relativePath);

                    Console.WriteLine($"[PDF] Sayfa {pageIndex + 1} kaydedildi: {fileName}");
                }
                pageIndex++;
            }

            Console.WriteLine($"[PDF] Toplam {savedPaths.Count} sayfa işlendi.");
            return savedPaths;
        }

        public async Task<byte[]> ReadFileAsync(string filePath)
        {
            var fullPath = Path.Combine(_basePath, filePath);
            return await File.ReadAllBytesAsync(fullPath);
        }

        public void DeleteFile(string filePath)
        {
            var fullPath = Path.Combine(_basePath, filePath);
            if (File.Exists(fullPath))
                File.Delete(fullPath);
        }
    }
}
