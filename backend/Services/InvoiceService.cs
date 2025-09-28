using Microsoft.EntityFrameworkCore;
using PdfSharp.Drawing;
using PdfSharp.Pdf;
using SapBasisPulse.Api.Data;
using System;
using System.IO;
using System.Threading.Tasks;

namespace SapBasisPulse.Api.Services
{
    public interface IInvoiceService
    {
        Task<byte[]> GenerateInvoicePdfAsync(Guid orderId);
    }

    public class InvoiceService : IInvoiceService
    {
        private readonly AppDbContext _context;

        public InvoiceService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<byte[]> GenerateInvoicePdfAsync(Guid orderId)
        {
            var payment = await _context.Payments
                .Include(p => p.Order)
                .ThenInclude(o => o.CustomerChoice)
                .ThenInclude(cc => cc.User)
                .Include(p => p.Order)
                .ThenInclude(o => o.Consultant)
                .FirstOrDefaultAsync(p => p.OrderId == orderId);

            if (payment == null)
            {
                throw new ArgumentException("Payment not found for the specified order");
            }

            // Create PDF document
            var document = new PdfDocument();
            document.Info.Title = $"Invoice INV-{orderId.ToString().Substring(0, 8).ToUpper()}";

            // Create page
            var page = document.AddPage();
            var gfx = XGraphics.FromPdfPage(page);
            var font = new XFont("Arial", 12);
            var boldFont = new XFont("Arial", 12, XFontStyleEx.Bold);
            var titleFont = new XFont("Arial", 18, XFontStyleEx.Bold);

            // Colors
            var black = XBrushes.Black;
            var gray = XBrushes.Gray;

            // Margins
            double margin = 50;
            double yPosition = margin;

            // Company header
            gfx.DrawString("SapBasis Pulse", titleFont, XBrushes.Black, new XPoint(margin, yPosition));
            yPosition += 30;
            gfx.DrawString("Professional SAP Consulting Services", font, XBrushes.Gray, new XPoint(margin, yPosition));
            yPosition += 20;
            gfx.DrawString("Invoice Number: " + $"INV-{orderId.ToString().Substring(0, 8).ToUpper()}", font, XBrushes.Black, new XPoint(margin, yPosition));
            yPosition += 20;
            gfx.DrawString("Date: " + DateTime.UtcNow.ToString("dd/MM/yyyy"), font, XBrushes.Black, new XPoint(margin, yPosition));
            yPosition += 30;

            // Bill To section
            gfx.DrawString("Bill To:", boldFont, XBrushes.Black, new XPoint(margin, yPosition));
            yPosition += 20;
            if (payment.Order?.CustomerChoice?.User != null)
            {
                var customer = payment.Order.CustomerChoice.User;
                gfx.DrawString(customer.FirstName + " " + customer.LastName, font, XBrushes.Black, new XPoint(margin, yPosition));
                yPosition += 15;
                gfx.DrawString(customer.Email, font, XBrushes.Black, new XPoint(margin, yPosition));
                yPosition += 15;
                if (!string.IsNullOrEmpty(customer.PhoneNumber))
                {
                    gfx.DrawString(customer.PhoneNumber, font, XBrushes.Black, new XPoint(margin, yPosition));
                    yPosition += 15;
                }
            }
            yPosition += 20;

            // Order details
            gfx.DrawString("Order Details:", boldFont, XBrushes.Black, new XPoint(margin, yPosition));
            yPosition += 20;
            gfx.DrawString("Order ID: " + orderId.ToString(), font, XBrushes.Black, new XPoint(margin, yPosition));
            yPosition += 15;
            if (payment.Order?.SupportTypeName != null)
            {
                gfx.DrawString("Service: " + payment.Order.SupportTypeName, font, XBrushes.Black, new XPoint(margin, yPosition));
                yPosition += 15;
            }
            if (payment.Order?.Description != null)
            {
                gfx.DrawString("Description: " + payment.Order.Description, font, XBrushes.Black, new XPoint(margin, yPosition));
                yPosition += 15;
            }
            yPosition += 20;

            // Payment details table
            double tableStartY = yPosition;
            double tableWidth = page.Width - 2 * margin;
            double rowHeight = 25;

            // Table headers
            gfx.DrawRectangle(XPens.Black, margin, tableStartY, tableWidth, rowHeight);
            gfx.DrawString("Description", boldFont, XBrushes.Black, new XPoint(margin + 10, tableStartY + 18));
            gfx.DrawString("Amount", boldFont, XBrushes.Black, new XPoint(margin + tableWidth - 100, tableStartY + 18));

            // Table content
            yPosition = tableStartY + rowHeight;
            gfx.DrawRectangle(XPens.Black, margin, yPosition, tableWidth, rowHeight);
            string serviceDescription = payment.Order?.SupportTypeName ?? "SAP Consulting Service";
            gfx.DrawString(serviceDescription, font, XBrushes.Black, new XPoint(margin + 10, yPosition + 18));
            string amountText = $"₹{(payment.AmountInPaise / 100m):N2}";
            gfx.DrawString(amountText, font, XBrushes.Black, new XPoint(margin + tableWidth - 100, yPosition + 18));

            // Total
            yPosition += rowHeight;
            gfx.DrawRectangle(XPens.Black, margin, yPosition, tableWidth, rowHeight);
            gfx.DrawString("Total", boldFont, XBrushes.Black, new XPoint(margin + 10, yPosition + 18));
            gfx.DrawString(amountText, boldFont, XBrushes.Black, new XPoint(margin + tableWidth - 100, yPosition + 18));

            // Payment status
            yPosition += 40;
            string statusText = $"Payment Status: {payment.Status}";
            var statusColor = payment.Status == Entities.PaymentStatus.Paid ||
                             payment.Status == Entities.PaymentStatus.EscrowReleased
                             ? XBrushes.Green : XBrushes.Red;
            gfx.DrawString(statusText, boldFont, statusColor, new XPoint(margin, yPosition));

            // Escrow information if applicable
            if (payment.IsInEscrow)
            {
                yPosition += 20;
                string escrowText = payment.Status == Entities.PaymentStatus.InEscrow
                    ? "Funds are currently held in escrow and will be released upon service completion."
                    : "Funds were held in escrow and have been released.";
                gfx.DrawString(escrowText, font, XBrushes.Orange, new XPoint(margin, yPosition));
            }

            // Footer
            yPosition = page.Height - 50;
            gfx.DrawString("Thank you for choosing SapBasis Pulse!", font, black, new XPoint(margin, yPosition));
            yPosition += 15;
            gfx.DrawString("For any queries, please contact support@sapbasis.com", font, gray, new XPoint(margin, yPosition));

            // Convert to byte array
            using (var stream = new MemoryStream())
            {
                document.Save(stream, false);
                return stream.ToArray();
            }
        }
    }
}