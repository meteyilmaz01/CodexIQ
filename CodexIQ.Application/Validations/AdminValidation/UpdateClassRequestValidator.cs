using CodexIQ.Application.DTOs.AdminDTOs;
using FluentValidation;

namespace CodexIQ.Application.Validations.AdminValidation
{
    public class UpdateClassRequestValidator : AbstractValidator<UpdateClassRequestDto>
    {
        public UpdateClassRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Sınıf adı boş bırakılamaz.")
                .MaximumLength(100).WithMessage("Sınıf adı en fazla 100 karakter olabilir.");

            RuleFor(x => x.TeacherId)
                .NotEmpty().WithMessage("Bir öğretmen seçilmelidir.");
        }
    }
}