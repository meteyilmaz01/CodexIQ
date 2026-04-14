using FluentValidation;

namespace CodexIQ.Application.Validations.TeacherValidation
{
    public class SaveRubricRequestValidator : AbstractValidator<SaveRubricRequestDto>
    {
        public SaveRubricRequestValidator()
        {
            RuleFor(x => x.Items)
                .NotEmpty().WithMessage("En az bir rubrik kriteri gereklidir.");

            RuleForEach(x => x.Items).ChildRules(item =>
            {
                item.RuleFor(i => i.Criteria)
                    .NotEmpty().WithMessage("Kriter adı boş olamaz.");

                item.RuleFor(i => i.MaxPoints)
                    .GreaterThan(0).WithMessage("Maksimum puan 0'dan büyük olmalıdır.");
            });
        }
    }
}
