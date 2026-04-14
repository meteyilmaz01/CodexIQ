using FluentValidation;

namespace CodexIQ.Application.Validations.TeacherValidation
{
    public class UpdateTeacherProfileRequestValidator : AbstractValidator<UpdateTeacherProfileRequestDto>
    {
        public UpdateTeacherProfileRequestValidator()
        {
            RuleFor(x => x.FirstName)
                .NotEmpty().WithMessage("Ad alanı gereklidir.")
                .MaximumLength(100).WithMessage("Ad en fazla 100 karakter olabilir.");

            RuleFor(x => x.LastName)
                .NotEmpty().WithMessage("Soyad alanı gereklidir.")
                .MaximumLength(100).WithMessage("Soyad en fazla 100 karakter olabilir.");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("E-posta adresi gereklidir.")
                .EmailAddress().WithMessage("Geçerli bir e-posta adresi giriniz.");
        }
    }
}
