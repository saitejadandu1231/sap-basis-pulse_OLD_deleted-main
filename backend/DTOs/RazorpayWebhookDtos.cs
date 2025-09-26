using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SapBasisPulse.Api.DTOs
{
    // Minimal webhook DTO covering necessary fields
    public class RazorpayEntityPayment
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("order_id")]
        public string OrderId { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("amount")]
        public long Amount { get; set; }
    }

    public class RazorpayWebhookPayload
    {
        [JsonPropertyName("entity")]
        public string Entity { get; set; } = string.Empty;

        [JsonPropertyName("event")]
        public string Event { get; set; } = string.Empty;

        [JsonPropertyName("payload")]
        public JsonElement Payload { get; set; }
    }
}
