using CodexIQ.Application.DTOs.AdminDTOs;
using FluentValidation;

namespace CodexIQ.Application.Validations.AdminValidation
{
    public class UpdateCourseRequestValidator : AbstractValidator<UpdateCourseRequestDto>
    {
        public UpdateCourseRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Ders adı boş bırakılamaz.")
                .MaximumLength(100).WithMessage("Ders adı en fazla 100 karakter olabilir.");

            RuleFor(x => x.ClassId)
                .NotEmpty().WithMessage("Dersin bağlı olduğu sınıf seçilmelidir.");
        }
    }
}