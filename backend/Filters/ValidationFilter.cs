using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using SapBasisPulse.Api.DTOs;

namespace SapBasisPulse.Api.Filters
{
    public class ValidationFilter : IActionFilter
    {
        public void OnActionExecuting(ActionExecutingContext context)
        {
            if (!context.ModelState.IsValid)
            {
                var errors = context.ModelState
                    .Where(x => x.Value.Errors.Count > 0)
                    .ToDictionary(
                        kvp => kvp.Key,
                        kvp => kvp.Value.Errors.Select(x => x.ErrorMessage).ToArray()
                    );

                var validationResponse = new ValidationErrorResponseDto(
                    "One or more validation errors occurred.",
                    errors
                )
                {
                    TraceId = context.HttpContext.TraceIdentifier
                };

                context.Result = new BadRequestObjectResult(validationResponse);
            }
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
            // No action needed after execution
        }
    }
}