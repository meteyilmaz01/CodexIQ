using FluentValidation;

namespace CodexIQ.Application.Validations.TeacherValidation
{
    public class CreateExamRequestValidator : AbstractValidator<CreateExamRequestDto>
    {
        public CreateExamRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Sınav adı gereklidir.")
                .MaximumLength(200).WithMessage("Sınav adı en fazla 200 karakter olabilir.");

            RuleFor(x => x.CourseId)
                .NotEmpty().WithMessage("Ders seçimi gereklidir.");
        }
    }
}
