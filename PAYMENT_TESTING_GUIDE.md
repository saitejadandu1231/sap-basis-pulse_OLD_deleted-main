# Payment Session Timeout Fix - Testing Guide 🧪

## Pre-Testing Checklist

- [ ] Backend is running (dotnet run)
- [ ] Frontend is running (npm run dev)
- [ ] Razorpay credentials configured in `appsettings.json`
- [ ] Database has test user and orders
- [ ] Browser DevTools open (F12)

## Test 1: Normal Payment Flow ✓ (Should Always Work)

**Objective**: Verify payment works under normal conditions

**Steps**:
1. Login as customer
2. Go to Tickets page
3. Find a closed ticket with "Pay Now" button
4. Click "Pay Now"
5. Complete payment in Razorpay
6. Observe console logs

**Expected Results**:
- [ ] Razorpay modal opens
- [ ] Console shows: `[Token Status] { userId, expiresInMinutes, ... }`
- [ ] After payment: `Payment successful! Payment has been completed.`
- [ ] Ticket status updates to "Paid"
- [ ] "Pay Now" button disappears

**Console Logs to Check**:
```
[Token Status] userId: xxx, expiresInMinutes: 59, isExpiringSoon: false
Razorpay response: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
Payment successful! Payment has been completed.
```

---

## Test 2: Slow Network Simulation 🐌

**Objective**: Test that slow payment processing still works

**Setup**:
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Click the throttling dropdown (Default: "No throttling")
4. Select "Slow 3G" (400kbps down, 400kbps up, 400ms latency)
5. **Keep this throttling enabled for the entire test**

**Steps**:
1. With throttling enabled, click "Pay Now"
2. Complete payment in Razorpay (will be slow)
3. Wait for verification response (will take longer)
4. Observe console and UI

**Expected Results**:
- [ ] Razorpay modal opens (takes longer)
- [ ] Payment completes
- [ ] Console shows payment logs (delayed)
- [ ] Ticket still updates to "Paid"
- [ ] "Pay Now" button disappears

**Console Logs to Check**:
```
[Token Status] ... expiresInMinutes: 59 (before payment)
Razorpay response: { ... } (delayed but arrives)
Payment successful! Payment has been completed.
```

---

## Test 3: Session Expiry Simulation 👻 (Advanced)

**Objective**: Test fallback when token expires during payment

**Setup** (Complex - Optional):
1. This requires manually expiring the JWT token
2. Best done in development with modified JWT expiry

**Alternative Approach** (Easier):
1. Just wait during slow 3G payment
2. Manual token expiry less practical for testing

**If You Want to Test Expiry**:

**Steps**:
1. Start payment on Slow 3G
2. In another tab, manually clear `localStorage`
3. Clear "authToken" specifically
4. Return to payment tab and complete payment
5. Observe the fallback behavior

**Expected Results**:
- [ ] Verification attempt fails (expected)
- [ ] Console shows: `Starting automatic payment status polling...`
- [ ] Console shows: `[Payment Polling] Starting payment status check (max 12 attempts, 5000ms interval)`
- [ ] Polling retries every 5 seconds
- [ ] Eventually finds "Paid" status
- [ ] Shows: `[Payment Polling] Payment verified successfully`
- [ ] Toast shows: `Payment verified! Refreshing ticket status...`
- [ ] Ticket updates to "Paid"

**Console Logs to Check**:
```
Payment verification failed: Error details...
Starting automatic payment status polling...
[Payment Polling] Starting payment status check (max 12 attempts, 5000ms interval)
[Payment Polling] Attempt 1/12
[Payment Polling] Attempt 2/12
...
[Payment Polling] Payment verified successfully
```

---

## Test 4: Multiple Concurrent Payments 💰

**Objective**: Verify system handles multiple payment attempts

**Setup**:
1. Have 2-3 browser tabs with same/different accounts
2. Each with a different ticket ready to pay

**Steps**:
1. Tab 1: Click "Pay Now" for Ticket A
2. Tab 2: Click "Pay Now" for Ticket B (while Tab 1 is still in payment)
3. Complete both payments
4. Check both tickets update

**Expected Results**:
- [ ] Both payment modals open
- [ ] Both can complete independently
- [ ] Each ticket updates with "Paid" status
- [ ] No conflicts or race conditions
- [ ] Each shows correct amount

---

## Test 5: Payment Cancellation

**Objective**: Verify cancelled payments don't cause issues

**Steps**:
1. Click "Pay Now"
2. Razorpay modal opens
3. Click "Close" or "X" in Razorpay modal
4. Click "Pay Now" again immediately

**Expected Results**:
- [ ] First modal closes without error
- [ ] Second "Pay Now" works normally
- [ ] Can complete payment
- [ ] No duplicate or stuck payments

**Console Check**:
```
Payment modal closed by user
(Processing state resets properly)
(Next payment attempt works)
```

---

## Test 6: Database Verification

**Objective**: Verify payment data is correctly stored

**After Completing Payments**:

Run this SQL query:
```sql
SELECT 
    id,
    "OrderNumber",
    "Status",
    "PaymentStatus",
    "RazorpayOrderId",
    "RazorpayPaymentId",
    "PaymentCompletedAt",
    "CalculatedAmount"
FROM "Orders" 
WHERE "PaymentStatus" = 'Paid'
ORDER BY "PaymentCompletedAt" DESC
LIMIT 5;
```

**Expected Results**:
- [ ] Recently paid tickets appear
- [ ] RazorpayOrderId is populated
- [ ] RazorpayPaymentId is populated
- [ ] PaymentCompletedAt shows current timestamp
- [ ] PaymentStatus = 'Paid'

---

## Test 7: Error Recovery - Network Failure

**Objective**: Test behavior when network fails during verification

**Setup**:
1. Open DevTools Network tab
2. Set to "Offline" mode
3. Start a "Pay Now" attempt

**Expected Results**:
- [ ] Payment gateway won't load (offline)
- [ ] See appropriate error message
- [ ] Can retry once online

**Alternative (More Realistic)**:
1. Enable "Slow 3G" throttling
2. Start payment
3. While verification is running, toggle offline
4. Watch for timeout/error handling
5. Go back online
6. Polling should retry automatically

---

## Test 8: Token Status Logging

**Objective**: Verify token debugging information is captured

**Steps**:
1. Open browser console
2. Click "Pay Now"
3. Search console for "[Token Status]"

**Expected Output Format**:
```javascript
[Token Status] {
  userId: "abc-123-def-456",
  expiresInMinutes: 59,  // Should be 59-60 for fresh token
  isExpiringSoon: false,
  expiresAt: "Oct 25, 2025, 3:45:30 PM"
}
```

**What to Verify**:
- [ ] Token exists
- [ ] expiresInMinutes shows time remaining (should be high)
- [ ] isExpiringSoon = false for new tokens
- [ ] expiresAt is in future

---

## Test 9: Payment Polling Status Display

**Objective**: Verify polling UI/UX

**To Trigger Polling**:
1. Enable Slow 3G (DevTools → Network)
2. Manually delete localStorage during payment
3. Complete payment
4. Observe polling behavior

**Expected UI**:
- [ ] Shows "Payment verification timeout" message first
- [ ] Then shows "Checking payment status... (1/12)"
- [ ] Updates attempt count as polling continues
- [ ] Finally shows "Payment verified!"
- [ ] Ticket updates to "Paid"

---

## Test 10: Admin and Consultant Views

**Objective**: Verify role-aware payment status display

**Steps**:
1. Login as Customer → See "Paid" status in closed, paid tickets
2. Logout → Login as Consultant → See same tickets (should show "Closed" not "Paid")
3. Logout → Login as Admin → See tickets (should show "Paid")

**Expected Results**:
- [ ] Customer sees: `Paid` ✓
- [ ] Consultant sees: `Closed` (business logic)
- [ ] Admin sees: `Paid`
- [ ] "Pay Now" button only shows for customers

---

## Troubleshooting Common Issues

### Issue: "Payment verification failed" Every Time

**Possible Causes**:
1. Razorpay credentials wrong in `appsettings.json`
2. Payment response missing fields
3. Signature validation failing

**Solution**:
- [ ] Verify `Razorpay:KeyId` and `Razorpay:KeySecret` in config
- [ ] Check browser console for missing fields
- [ ] Check server console for validation errors
- [ ] Test with Razorpay test credentials first

### Issue: Polling Starts But Doesn't Complete

**Possible Causes**:
1. Order not found in database
2. Payment status not updating in DB
3. API endpoint `/orders/{id}` not working

**Solution**:
- [ ] Check if order exists: `SELECT * FROM "Orders" WHERE id = 'xxx'`
- [ ] Verify payment status is "Paid" after successful payment
- [ ] Check if `/orders/get` endpoint is working
- [ ] Check backend logs for database errors

### Issue: Token Status Shows "isExpiringSoon: true" or Negative Minutes

**Possible Causes**:
1. Token actually is expired
2. Browser clock is wrong
3. JWT secret mismatch

**Solution**:
- [ ] Re-login to get fresh token
- [ ] Check system time is correct
- [ ] Clear browser cache and cookies
- [ ] Verify JWT secret in backend

### Issue: "Pay Now" Button Still Shows After Payment

**Possible Causes**:
1. Payment status not updated in DB
2. Frontend not fetching latest data
3. Cache issue

**Solution**:
- [ ] Refresh page (F5)
- [ ] Check database payment status
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Re-login
- [ ] Check if ticket ID is correct

---

## Performance Benchmarks

### Expected Response Times (Normal Network)

| Operation | Expected Time |
|-----------|---------------|
| Pay Now button click → Modal open | 1-2 sec |
| Complete payment → Response received | 2-10 sec |
| Payment verification | 1-3 sec |
| Ticket refresh | 1-2 sec |
| Total | 5-17 sec |

### Expected Response Times (Slow 3G)

| Operation | Expected Time |
|-----------|---------------|
| Pay Now button click → Modal open | 5-10 sec |
| Complete payment → Response received | 10-30 sec |
| Payment verification | 5-15 sec |
| Ticket refresh | 5-10 sec |
| Total | 25-65 sec |

### Polling Performance

| Metric | Value |
|--------|-------|
| Polling interval | 5 seconds |
| Max polling attempts | 12 |
| Total polling time | 60 seconds |
| Success rate | Should be ~95% within 30 seconds |

---

## Sign-Off Checklist

- [ ] Test 1 (Normal) passed
- [ ] Test 2 (Slow Network) passed
- [ ] Test 4 (Concurrent) passed
- [ ] Test 5 (Cancellation) passed
- [ ] Test 6 (Database) passed
- [ ] Test 8 (Token Logging) verified
- [ ] Test 9 (Polling UI) verified
- [ ] Test 10 (Role Views) verified
- [ ] No console errors
- [ ] Database shows paid payments
- [ ] Performance acceptable
- [ ] Ready for production

---

## Post-Deployment Monitoring

### First 24 Hours
- Monitor payment success rate
- Watch for "verification failed" errors
- Check polling activation frequency
- Monitor database for "Paid" status updates

### First Week
- Track average payment time
- Monitor error rates
- Collect polling statistics
- Review any customer complaints

### Ongoing
- Weekly payment reports
- Error rate trending
- Database query performance
- Razorpay API health

---

**Date Tested**: _______________  
**Tested By**: _______________  
**Status**: ☐ PASS ☐ FAIL  
**Notes**: _________________________________________________________________
