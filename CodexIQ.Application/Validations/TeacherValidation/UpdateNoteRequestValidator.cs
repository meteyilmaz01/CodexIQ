using FluentValidation;

namespace CodexIQ.Application.Validations.TeacherValidation
{
    public class UpdateNoteRequestValidator : AbstractValidator<UpdateNoteRequestDto>
    {
        public UpdateNoteRequestValidator()
        {
            RuleFor(x => x.Note)
                .NotEmpty().WithMessage("Not alanı boş olamaz.")
                .MaximumLength(1000).WithMessage("Not en fazla 1000 karakter olabilir.");
        }
    }
}
