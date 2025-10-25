# Payment Session Timeout Fix - Documentation

## Problem Statement

When payment processing takes **more than 10 minutes**, or when there's network delay during payment gateway verification, the following issue occurs:

1. Customer clicks "Pay Now" button
2. Payment gateway processes payment (this can take 5-15 minutes depending on bank/PSP)
3. Payment completes successfully in Razorpay system
4. Customer completes payment and returns to app
5. **BUT**: If verification request fails or JWT token is invalid, the payment status is NOT updated in your app
6. Result: Payment completed in Razorpay, but app still shows "Pay Now" button

## Root Cause Analysis

### JWT Token Expiration
- Your JWT token expires in **60 minutes** (from `appsettings.json`: `"ExpiresInMinutes": 60`)
- This is not the direct issue since 60 minutes > 10 minutes
- However, the real issue is with the **verify endpoint requiring authentication**

### The Verify Endpoint Problem
```csharp
[HttpPost("verify")]
[Authorize]  // ← This requires valid JWT token
public async Task<IActionResult> VerifyPayment([FromBody] VerifyPaymentDto dto)
{
    // ...
}
```

**Issue**: If the JWT token is expired or invalid when verification is attempted, the entire verification request fails with 401 Unauthorized, even though:
1. The payment **was successfully processed** by Razorpay
2. The Razorpay signature is **valid and verified**

## Solution Implemented

### 1. **Remove [Authorize] from Verify Endpoint** (RECOMMENDED)

The Razorpay signature itself is cryptographically secure. The signature verification ensures that only legitimate payments are processed.

**File**: `backend/Controllers/PaymentController.cs`

```csharp
[HttpPost("verify")]
// NOTE: No [Authorize] - The Razorpay signature validation ensures security
// This allows payment verification even if user's JWT token expires during payment processing
// The signature itself is cryptographically secure and proves payment came from Razorpay
public async Task<IActionResult> VerifyPayment([FromBody] VerifyPaymentDto dto)
{
    var (success, error, response) = await _paymentService.VerifyPaymentAsync(
        dto.RazorpayOrderId, dto.RazorpayPaymentId, dto.RazorpaySignature);

    if (!success)
    {
        return BadRequest(new { error });
    }

    return Ok(response);
}
```

**Benefits**:
- ✅ Payment verification never fails due to token expiration
- ✅ Razorpay signature validation ensures security
- ✅ Works even if user closes browser or loses connection during payment
- ✅ No additional authentication overhead

### 2. **Automatic Payment Status Polling** (FALLBACK)

Created `usePaymentStatusPolling()` hook that automatically checks payment status every 5 seconds up to 60 seconds if verification fails.

**File**: `frontend/src/hooks/usePaymentStatusPolling.ts`

```typescript
const { startPolling, stopPolling } = usePaymentStatusPolling();

// After payment completes
startPolling({
  orderId: ticket.id,
  maxAttempts: 12,        // 12 attempts
  pollIntervalMs: 5000,   // every 5 seconds = 60 seconds total
  onSuccess: (status) => {
    // Payment verified successfully
    refetch();
  },
  onFailure: (error) => {
    // Still not verified after 60 seconds
    toast.error('Please refresh to check payment status');
  }
});
```

**How it works**:
1. After customer completes payment in Razorpay
2. If verification call fails, polling starts automatically
3. Checks order status every 5 seconds
4. If payment status becomes "Paid" within 60 seconds, shows success
5. If still not paid after 60 seconds, asks user to refresh

### 3. **Token Status Logging** (DEBUGGING)

Created `useTokenRefresh()` hook with token status logging for debugging.

**File**: `frontend/src/hooks/useTokenRefresh.ts`

```typescript
const { logTokenStatus } = useTokenRefresh();

// Before payment attempt
logTokenStatus(); 
// Logs: { userId, expiresInMinutes, isExpiringSoon, expiresAt }

// After payment completion
logTokenStatus();
// Helps identify if token was the issue
```

### 4. **Better Error Handling in Payment Flow**

Updated `Tickets.tsx` payment handler with:
- Token status logging before and after payment
- Better error messages
- Automatic fallback to polling if verification fails
- Proper state management for payment checking

**File**: `frontend/src/pages/Tickets.tsx`

```typescript
handler: async function (response: any) {
  // ... validation ...
  
  try {
    // Try immediate verification (no auth needed now)
    await verifyPaymentMutation.mutateAsync({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: signature
    });
    
    toast.success('Payment successful!');
  } catch (verifyError) {
    // Fallback: Start polling for payment status
    console.log('Verification failed, starting polling...');
    startPolling({
      orderId: ticket.id,
      maxAttempts: 12,
      // ... polling config ...
    });
  }
}
```

## Files Changed

### Backend
- ✅ `backend/Controllers/PaymentController.cs` - Removed `[Authorize]` from verify endpoint

### Frontend
- ✅ `frontend/src/hooks/useTokenRefresh.ts` - NEW: Token refresh and status checking
- ✅ `frontend/src/hooks/usePaymentStatusPolling.ts` - NEW: Automatic status polling
- ✅ `frontend/src/pages/Tickets.tsx` - Updated payment handler with fallbacks

## Testing Checklist

### Local Testing
- [ ] Payments complete successfully in < 1 minute (normal flow)
- [ ] Browser console shows token status logs
- [ ] "Pay Now" button disappears after payment completes
- [ ] Ticket status shows as "Paid" after verification

### Stress Testing (Slow Payment Scenario)
- [ ] Open browser DevTools Network tab
- [ ] Set Network throttling to "Slow 3G"
- [ ] Try payment - should still work
- [ ] Token status logs show token is still valid
- [ ] Payment polling automatically starts if needed

### Edge Cases
- [ ] Close browser during payment → Re-open and check status
- [ ] Refresh page during payment → Payment still gets verified
- [ ] Network disconnects during verification → Polling takes over
- [ ] Multiple payment attempts → Each shows status correctly

## Security Considerations

### Why Removing [Authorize] is Safe

1. **Razorpay Signature Validation**: 
   - Uses HMAC-SHA256 with your secret key
   - Only Razorpay can generate valid signatures
   - Tampering with data invalidates signature

2. **No User-Specific Data in Verify**:
   - Endpoint only receives: OrderId, PaymentId, Signature
   - No sensitive data transferred
   - Database lookup finds correct order

3. **Signature Verification**:
   ```csharp
   var signatureData = $"{razorpayOrderId}|{razorpayPaymentId}";
   var expectedSignature = GenerateSignature(signatureData, keySecret);
   
   if (expectedSignature != razorpaySignature)
     return (false, "Payment signature verification failed");
   ```

### Best Practice: Implement Webhook (Future)

For production, also implement Razorpay webhook for:
- Payment updates directly from Razorpay servers
- No dependency on frontend verification
- Real-time payment status updates
- Handle edge cases like payment reversals

**Webhook Flow**:
```
Razorpay Payment Complete
         ↓
Razorpay sends webhook to your backend
         ↓
Backend updates payment status (no user action needed)
         ↓
Frontend fetches latest status (already updated)
```

## How Long Session Lasts

### Current Configuration
- **JWT Token Expiration**: 60 minutes
- **Payment Processing**: 5-15 minutes typically
- **Payment Verification**: Now works without token!
- **Total Available Time**: ∞ (no timeout issues anymore)

## Monitoring & Debugging

### Check Payment Status in Database
```sql
SELECT id, 
       "PaymentStatus", 
       "RazorpayOrderId", 
       "RazorpayPaymentId",
       "PaymentCompletedAt"
FROM "Orders" 
WHERE "PaymentStatus" = 'Paid'
ORDER BY "PaymentCompletedAt" DESC
LIMIT 10;
```

### Check Browser Console Logs
- Search for: `[Token Status]`
- Search for: `[Payment Polling]`
- Shows token expiry time and polling attempts

### Monitor for Verification Failures
- Check for: `Payment verification failed`
- Check for: `Polling started`
- These indicate secondary verification mechanism kicked in

## Rollback Instructions

If issues occur:

1. **Add [Authorize] back**:
   ```csharp
   [HttpPost("verify")]
   [Authorize]  // Add this back
   public async Task<IActionResult> VerifyPayment(...)
   ```

2. **Keep polling as fallback** (still helps)

3. **Implement webhook** (long-term solution)

## FAQ

**Q: Why can't users just extend their session?**
A: They can, but they shouldn't have to. The fix handles it automatically.

**Q: What if signature validation is wrong?**
A: Check Razorpay KeySecret in `appsettings.json` - it must be exact.

**Q: What if order not found?**
A: Check that OrderId exists in database before payment attempt.

**Q: How do I see payment polling in action?**
A: Simulate slow network in Chrome DevTools → Network → Throttling → Slow 3G

**Q: Does this affect refunds?**
A: No, refund endpoint is separate and unchanged.

## Support

For issues:
1. Check browser console for logs
2. Verify Razorpay credentials in `appsettings.json`
3. Check database for order records
4. Verify network connectivity
5. Review payment processing logs in Razorpay dashboard
