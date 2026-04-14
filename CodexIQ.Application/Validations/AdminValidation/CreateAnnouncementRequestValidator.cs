using FluentValidation;

namespace CodexIQ.Application.Validations.AdminValidation
{
    public class CreateAnnouncementRequestValidator : AbstractValidator<CreateAnnouncementRequestDto>
    {
        public CreateAnnouncementRequestValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("Başlık alanı boş olamaz.")
                .MaximumLength(200).WithMessage("Başlık en fazla 200 karakter olabilir.");

            RuleFor(x => x.Content)
                .NotEmpty().WithMessage("İçerik alanı boş olamaz.");
        }
    }
}
