using CodexIQ.Application.DTOs.StudentsDTOs.StudentDashboardDTOS;
using CodexIQ.Application.Exceptions;
using CodexIQ.Application.Interfaces.CoreDataInterfaces;
using CodexIQ.Application.Interfaces.Services;
using CodexIQ.Application.Interfaces.Storage;
using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;

namespace CodexIQ.Application.Services
{
    public class StudentService : IStudentService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IFileStorageService _fileStorage;

        public StudentService(IUnitOfWork unitOfWork, IFileStorageService fileStorage)
        {
            _unitOfWork = unitOfWork;
            _fileStorage = fileStorage;
        }

        public async Task<List<RecentResultsDto>> GetRecentResultsAsync(Guid studentId)
        {
            var papers = await _unitOfWork.Student.GetRecentExamPapersAsync(studentId, 5);

            var items = papers.Select(ep => new RecentResultsDto
            {
                Id = ep.Id,
                ExamName = ep.Exam.Name,
                CourseName = ep.Exam.Course.Name,
                UploadedAt = ep.FinalEvaluation!.EvaluatedAt,
                FinalScore = ep.FinalEvaluation.FinalScore,
                Status = ep.FinalEvaluation.FinalScore >= 85 ? "High"
                       : ep.FinalEvaluation.FinalScore >= 70 ? "Medium"
                       : "Low"
            }).ToList();

            return items;
        }

        public async Task<StudentProfileDto> GetProfileAsync(Guid studentId)
        {
            var user = await _unitOfWork.User.GetByIdAsync(studentId);
            if (user == null) throw new NotFoundException("Kullanıcı bulunamadı");

            return new StudentProfileDto
            {
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email
            };
        }

        public async Task UpdateProfileAsync(Guid studentId, UpdateProfileRequestDto request)
        {
            var user = await _unitOfWork.User.GetByIdAsync(studentId);
            if (user == null) throw new NotFoundException("Kullanıcı bulunamadı");

            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.Email = request.Email;

            _unitOfWork.User.Update(user);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<StatsDto> GetStatsDashboardAsync(Guid studentId)
        {
            var average = await _unitOfWork.Student.GetAverageScoreAsync(studentId);
            var lastScore = await _unitOfWork.Student.GetLastExamScoreAsync(studentId);
            var totalExams = await _unitOfWork.Student.GetTotalExamCountAsync(studentId);
            var codeTests = await _unitOfWork.Student.GetCodeTestCountAsync(studentId);

            return new StatsDto
            {
                AverageScore = average,
                LastScored = lastScore,
                TotalExamsTaken = totalExams,
                CodeTestCount = codeTests
            };

        }

        public async Task<List<WeakTopicsDto>> GetWeakTopicsAsync(Guid studentId)
        {
            var topics = await _unitOfWork.Student.GetWeakTopicsAsync(studentId);

            return topics.Select(t => new WeakTopicsDto
            {
                Topic = t.Key,
                SuccessPercentage = t.Value
            }).ToList();
        }

        public async Task<ExamResultDetailDto?> GetExamResultDetailAsync(Guid studentId, Guid examPaperId)
        {
            var paper = await _unitOfWork.Student.GetExamResultDetailAsync(studentId, examPaperId);

            if (paper == null || paper.FinalEvaluation == null)
                return null;

            var syntaxErrors = new List<CodeErrorDto>();
            var logicErrors = new List<CodeErrorDto>();

            if (!string.IsNullOrEmpty(paper.FinalEvaluation.SyntaxErrorsJson))
            {
                syntaxErrors = JsonSerializer.Deserialize<List<CodeErrorDto>>(
                    paper.FinalEvaluation.SyntaxErrorsJson,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                ) ?? new();
            }

            if (!string.IsNullOrEmpty(paper.FinalEvaluation.LogicErrorsJson))
            {
                logicErrors = JsonSerializer.Deserialize<List<CodeErrorDto>>(
                    paper.FinalEvaluation.LogicErrorsJson,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                ) ?? new();
            }

            return new ExamResultDetailDto
            {
                Id = paper.Id,
                ExamName = paper.Exam.Name,
                CourseName = paper.Exam.Course.Name,
                CodePurpose = paper.Exam.CodePurpose,
                Date = paper.FinalEvaluation.EvaluatedAt,
                TotalScore = paper.FinalEvaluation.FinalScore,
                Code = paper.ExtractedCode?.RawCode ?? string.Empty,
                TeacherNote = paper.FinalEvaluation.TeacherNote,
                SyntaxErrors = syntaxErrors,
                LogicErrors = logicErrors,
                ModelScores = paper.AIModelResults.Select(ai => new ModelScoreDto
                {
                    ModelName = ai.ModelName,
                    Score = ai.Score
                }).ToList()
            };
        }

    public async Task<byte[]?> GetExamPaperImageAsync(Guid studentId, Guid examPaperId)
    {
        // Öğrencinin kendi kağıdını getir (student repository zaten studentId filtresi uygular)
        var paper = await _unitOfWork.Student.GetExamResultDetailAsync(studentId, examPaperId);

        if (paper == null || string.IsNullOrWhiteSpace(paper.ImagePath))
            return null;

        // Öğretmen paylaşmamışsa görseli gösterme
        if (paper.FinalEvaluation?.IsShared != true)
            return null;

        try
        {
            return await _fileStorage.ReadFileAsync(paper.ImagePath);
        }
        catch
        {
            return null;
        }
    }

    public async Task<PaginatedResult<ExamResultListItemDto>> GetExamResultsAsync(
            Guid studentId,
            string? search,
            string? course,
            string? sortBy,
            int page,
            int pageSize)
        {
            var (papers, totalCount) = await _unitOfWork.Student
                .GetExamResultsAsync(studentId, search, course, sortBy, page, pageSize);

            var items = papers.Select(ep => new ExamResultListItemDto
            {
                Id = ep.Id,
                ExamName = ep.Exam.Name,
                CourseName = ep.Exam.Course.Name,
                Date = ep.FinalEvaluation!.EvaluatedAt,
                Score = ep.FinalEvaluation.FinalScore,
                SyntaxErrorCount = ep.FinalEvaluation.SyntaxErrorCount,
                LogicErrorCount = ep.FinalEvaluation.LogicErrorCount,
                Status = ep.FinalEvaluation.FinalScore >= 85 ? "High"
                       : ep.FinalEvaluation.FinalScore >= 70 ? "Medium"
                       : "Low"
            }).ToList();

            return new PaginatedResult<ExamResultListItemDto>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<List<AdminAnnouncementDto>> GetAnnouncementsAsync()
        {
            return await _unitOfWork.Admin.GetAnnouncementsAsync();
        }

    }
}
