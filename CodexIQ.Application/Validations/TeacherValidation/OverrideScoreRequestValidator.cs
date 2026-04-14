using FluentValidation;

namespace CodexIQ.Application.Validations.TeacherValidation
{
    public class OverrideScoreRequestValidator : AbstractValidator<OverrideScoreRequestDto>
    {
        public OverrideScoreRequestValidator()
        {
            RuleFor(x => x.NewScore)
                .InclusiveBetween(0, 100).WithMessage("Puan 0 ile 100 arasında olmalıdır.");
        }
    }
}
