using System;
using System.Threading.Tasks;
using SapBasisPulse.Api.DTOs;

namespace SapBasisPulse.Api.Services.Payments
{
    public interface IPaymentService
    {
        Task<CreatePaymentOrderResponse> CreateOrderAsync(Guid orderId, Guid userId);
        Task<CreatePaymentOrderResponse> CreateOrderOnCloseAsync(Guid orderId, Guid consultantUserId);
        Task<PaymentSummaryDto> VerifyPaymentAsync(VerifyPaymentRequest request, Guid userId);
        Task<PaymentSummaryDto?> GetPaymentSummaryAsync(Guid orderId);
    }
}
