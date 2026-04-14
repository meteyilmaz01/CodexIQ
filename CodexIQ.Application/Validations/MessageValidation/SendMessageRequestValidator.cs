using FluentValidation;

namespace CodexIQ.Application.Validations.MessageValidation
{
    public class SendMessageRequestValidator : AbstractValidator<SendMessageRequestDto>
    {
        public SendMessageRequestValidator()
        {
            RuleFor(x => x.ReceiverId)
                .NotEmpty().WithMessage("Alıcı bilgisi zorunludur.");

            RuleFor(x => x.Text)
                .NotEmpty().WithMessage("Mesaj boş olamaz.");
        }
    }
}
