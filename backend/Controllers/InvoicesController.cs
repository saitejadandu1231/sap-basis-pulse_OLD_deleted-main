using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SapBasisPulse.Api.Services.Payments;
using SapBasisPulse.Api.Services;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Data;

namespace SapBasisPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InvoicesController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly IInvoiceService _invoiceService;
        private readonly AppDbContext _context;

        public InvoicesController(IPaymentService paymentService, IInvoiceService invoiceService, AppDbContext context)
        {
            _paymentService = paymentService;
            _invoiceService = invoiceService;
            _context = context;
        }

        [HttpPost("generate/{orderId}")]
        [Authorize]
        public async Task<IActionResult> GenerateInvoice(Guid orderId)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            try
            {
                // Get payment summary to verify access
                var paymentSummary = await _paymentService.GetPaymentSummaryAsync(orderId);
                if (paymentSummary == null)
                {
                    return NotFound(new { error = "Payment not found" });
                }

                // Generate PDF invoice (placeholder - implement actual PDF generation)
                var invoiceData = new
                {
                    invoiceNumber = $"INV-{orderId.ToString().Substring(0, 8)}",
                    orderId = orderId,
                    amount = paymentSummary.AmountInPaise / 100m,
                    currency = paymentSummary.Currency,
                    status = paymentSummary.Status,
                    generatedAt = DateTime.UtcNow,
                    downloadUrl = $"/api/invoices/download/{orderId}"
                };

                return Ok(new
                {
                    message = "Invoice generated successfully",
                    invoice = invoiceData
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to generate invoice", detail = ex.Message });
            }
        }

        [HttpGet("download/{orderId}")]
        [Authorize]
        public async Task<IActionResult> DownloadInvoice(Guid orderId)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            try
            {
                // Get payment summary to verify access
                var paymentSummary = await _paymentService.GetPaymentSummaryAsync(orderId);
                if (paymentSummary == null)
                {
                    return NotFound(new { error = "Payment not found" });
                }

                // Check if user has access to this invoice
                // Customers can access their own payments, consultants can access payments for their orders
                var hasAccess = false;
                if (userRole == "Customer")
                {
                    // Get order details to verify customer ownership
                    var order = await _context.Orders
                        .Include(o => o.CustomerChoice)
                        .FirstOrDefaultAsync(o => o.Id == orderId);
                    hasAccess = order?.CustomerChoice?.UserId == userId;
                }
                else if (userRole == "Consultant")
                {
                    // Get order details to verify consultant assignment
                    var order = await _context.Orders
                        .FirstOrDefaultAsync(o => o.Id == orderId);
                    hasAccess = order?.ConsultantId == userId;
                }
                else if (userRole == "Admin")
                {
                    hasAccess = true;
                }

                if (!hasAccess)
                {
                    return Forbid();
                }

                // Generate PDF invoice
                var pdfBytes = await _invoiceService.GenerateInvoicePdfAsync(orderId);
                var fileName = $"Invoice_INV-{orderId.ToString().Substring(0, 8).ToUpper()}.pdf";

                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to generate invoice", detail = ex.Message });
            }
        }
    }
}