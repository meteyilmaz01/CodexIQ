using FluentValidation;

namespace CodexIQ.Application.Validations.TeacherValidation
{
    public class BulkShareRequestValidator : AbstractValidator<BulkShareRequestDto>
    {
        public BulkShareRequestValidator()
        {
            RuleFor(x => x.ExamPaperIds)
                .NotEmpty().WithMessage("En az bir sınav kağıdı seçilmelidir.");
        }
    }
}
