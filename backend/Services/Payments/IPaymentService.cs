using System;
using System.Threading.Tasks;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Entities;

namespace SapBasisPulse.Api.Services.Payments
{
    public interface IPaymentService
    {
        Task<CreatePaymentOrderResponse> CreateOrderAsync(Guid orderId, Guid userId);
        Task<CreatePaymentOrderResponse> CreateOrderOnCloseAsync(Guid orderId, Guid consultantUserId);
        Task<PaymentSummaryDto> VerifyPaymentAsync(VerifyPaymentRequest request, Guid userId);
        Task<PaymentSummaryDto?> GetPaymentSummaryAsync(Guid orderId);
        Task<Payment?> GetPaymentByOrderIdAsync(Guid orderId);
        Task ProcessPayoutAsync(Guid orderId);
        Task<RefundResponse> ProcessRefundAsync(Guid orderId, string reason, long? amountInPaise = null);
        Task<PaymentAnalyticsDto> GetPaymentAnalyticsAsync(DateTime? startDate = null, DateTime? endDate = null);
        Task<ConsultantEarningsDto> GetConsultantEarningsAsync(Guid consultantId, DateTime? startDate = null, DateTime? endDate = null);
        Task<ConsultantPaymentDto[]> GetConsultantPaymentsAsync(Guid consultantId);
        Task<ConsultantEarningsSummaryDto> GetConsultantEarningsSummaryAsync(Guid consultantId);
        Task<bool> SendPaymentReminderAsync(Guid orderId);
        Task<bool> SchedulePaymentReminderAsync(Guid orderId, DateTime scheduledFor, string reminderType, string? message = null);
    }
}
