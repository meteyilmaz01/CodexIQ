using CodexIQ.Application.Exceptions;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using SharpGrip.FluentValidation.AutoValidation.Mvc.Results;

namespace CodexIQ.Api.Middlewares
{
    public class FluentValidationExceptionResultFactory : IFluentValidationAutoValidationResultFactory
    {
        public Task<IActionResult?> CreateActionResult(
            ActionExecutingContext context,
            ValidationProblemDetails? validationProblemDetails,
            IDictionary<IValidationContext, FluentValidation.Results.ValidationResult> validationResults)
        {
            var errors = validationResults
                .SelectMany(x => x.Value.Errors)
                .Where(x => !string.IsNullOrWhiteSpace(x.ErrorMessage))
                .Select(x => x.ErrorMessage)
                .Distinct()
                .ToList();

            throw new CodexIQ.Application.Exceptions.ValidationException(errors.Count > 0
                ? errors
                : new List<string> { "Doğrulama hatası" });
        }
    }
}