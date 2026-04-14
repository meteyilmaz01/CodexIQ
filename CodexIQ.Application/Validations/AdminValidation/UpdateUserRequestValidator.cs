using CodexIQ.Application.DTOs.AdminDTOs;
using FluentValidation;

namespace CodexIQ.Application.Validations.AdminValidation
{
    public class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequestDto>
    {
        public UpdateUserRequestValidator()
        {
            RuleFor(x => x.FirstName)
                .NotEmpty().WithMessage("Ad alanı boş bırakılamaz.")
                .MaximumLength(50).WithMessage("Ad alanı en fazla 50 karakter olabilir.");

            RuleFor(x => x.LastName)
                .NotEmpty().WithMessage("Soyad alanı boş bırakılamaz.")
                .MaximumLength(50).WithMessage("Soyad alanı en fazla 50 karakter olabilir.");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("E-posta adresi boş bırakılamaz.")
                .EmailAddress().WithMessage("Geçerli bir e-posta adresi formatı giriniz.");

            RuleFor(x => x.Role)
                .IsInEnum().WithMessage("Geçerli bir kullanıcı rolü seçiniz.");
        }
    }
}