using FluentValidation;

namespace CodexIQ.Application.Validations.AdminValidation
{
    public class CreateClassRequestValidator : AbstractValidator<CreateClassRequestDto>
    {
        public CreateClassRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Sınıf adı boş olamaz.");

            RuleFor(x => x.TeacherId)
                .NotEmpty().WithMessage("Geçerli bir öğretmen seçilmelidir.");
        }
    }
}
