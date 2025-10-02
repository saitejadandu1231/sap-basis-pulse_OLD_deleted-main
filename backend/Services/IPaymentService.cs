using System.Threading.Tasks;

namespace SapBasisPulse.Api.Services
{
    public interface IPaymentService
    {
        Task<(bool success, string? error, object? response)> CreatePaymentOrderAsync(decimal amount, string currency, Guid orderId);
        Task<(bool success, string? error, object? response)> VerifyPaymentAsync(string razorpayOrderId, string razorpayPaymentId, string razorpaySignature);
        Task<(bool success, string? error)> UpdateOrderPaymentStatusAsync(Guid orderId, string paymentStatus, string? razorpayPaymentId = null);
    }
}