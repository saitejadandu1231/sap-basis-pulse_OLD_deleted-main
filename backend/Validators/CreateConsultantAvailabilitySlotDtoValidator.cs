using FluentValidation;
using SapBasisPulse.Api.DTOs;

namespace SapBasisPulse.Api.Validators
{
    public class CreateConsultantAvailabilitySlotDtoValidator : AbstractValidator<CreateConsultantAvailabilitySlotDto>
    {
        public CreateConsultantAvailabilitySlotDtoValidator()
        {
            RuleFor(x => x.ConsultantId)
                .NotEmpty().WithMessage("Consultant ID is required");

            RuleFor(x => x.SlotStartTime)
                .NotEmpty().WithMessage("Slot start time is required")
                .GreaterThan(DateTime.UtcNow).WithMessage("Slot start time must be in the future");

            RuleFor(x => x.SlotEndTime)
                .NotEmpty().WithMessage("Slot end time is required")
                .GreaterThan(x => x.SlotStartTime).WithMessage("Slot end time must be after start time");

            RuleFor(x => x)
                .Must(HaveValidDuration).WithMessage("Slot duration must be at least 1 hour");
        }

        private bool HaveValidDuration(CreateConsultantAvailabilitySlotDto dto)
        {
            var duration = dto.SlotEndTime - dto.SlotStartTime;
            return duration.TotalHours >= 1;
        }
    }
}