using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace SapBasisPulse.Api.Services
{
    public interface ISupabaseEmailService
    {
        Task SendEmailAsync(string to, string subject, string htmlContent);
    }

    public class SupabaseEmailService : ISupabaseEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<SupabaseEmailService> _logger;
        private readonly HttpClient _httpClient;

        public SupabaseEmailService(IConfiguration config, ILogger<SupabaseEmailService> logger, HttpClient httpClient)
        {
            _config = config;
            _logger = logger;
            _httpClient = httpClient;
        }

        public async Task SendEmailAsync(string to, string subject, string htmlContent)
        {
            var supabaseSection = _config.GetSection("Supabase");

            // Check if email is disabled for development
            if (supabaseSection["DisableEmailInDevelopment"]?.ToLower() == "true" &&
                _config["ASPNETCORE_ENVIRONMENT"]?.ToLower() == "development")
            {
                _logger.LogInformation("Supabase email sending is disabled in development. Would have sent email to {To} with subject {Subject}", to, subject);
                _logger.LogDebug("Email content: {Content}", htmlContent);
                return;
            }

            var supabaseUrl = supabaseSection["Url"];
            var serviceRoleKey = supabaseSection["ServiceRoleKey"];

            if (string.IsNullOrEmpty(supabaseUrl) || string.IsNullOrEmpty(serviceRoleKey))
            {
                _logger.LogWarning("Supabase configuration is incomplete. Email not sent to {To}", to);
                return;
            }

            var emailPayload = new
            {
                to = new[] { to },
                subject = subject,
                html = htmlContent
            };

            var jsonContent = JsonSerializer.Serialize(emailPayload);
            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {serviceRoleKey}");
            _httpClient.DefaultRequestHeaders.Add("apikey", serviceRoleKey);

            try
            {
                var response = await _httpClient.PostAsync($"{supabaseUrl}/auth/v1/send-email", content);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Email sent successfully via Supabase to {To}", to);
                }
                else
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("Failed to send email via Supabase to {To}. Status: {StatusCode}, Response: {Response}",
                        to, response.StatusCode, responseContent);
                }
            }
            catch (System.Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send email via Supabase to {To}", to);

                // Don't throw in development, but do in production
                if (_config["ASPNETCORE_ENVIRONMENT"]?.ToLower() != "development")
                {
                    throw;
                }
            }
        }
    }
}