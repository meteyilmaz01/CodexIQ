using FluentValidation;

namespace CodexIQ.Application.Validations.AdminValidation
{
    public class CreateCourseRequestValidator : AbstractValidator<CreateCourseRequestDto>
    {
        public CreateCourseRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Ders adı boş olamaz.");

            RuleFor(x => x.ClassId)
                .NotEmpty().WithMessage("Geçerli bir sınıf seçilmelidir.");
        }
    }
}
