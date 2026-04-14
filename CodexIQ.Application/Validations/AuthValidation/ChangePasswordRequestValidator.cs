using CodexIQ.Application.DTOs.AuthDTOs;
using FluentValidation;

namespace CodexIQ.Application.Validations.AuthValidation
{
    public class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequestDto>
    {
        public ChangePasswordRequestValidator()
        {
            RuleFor(x => x.CurrentPassword)
                .NotEmpty().WithMessage("Mevcut şifre gereklidir.");

            RuleFor(x => x.NewPassword)
                .NotEmpty().WithMessage("Yeni şifre gereklidir.")
                .MinimumLength(6).WithMessage("Yeni şifre en az 6 karakter olmalıdır.")
                .NotEqual(x => x.CurrentPassword).WithMessage("Yeni şifre mevcut şifre ile aynı olamaz.");
        }
    }
}
