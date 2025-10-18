# Hours Worked & Amount Calculation Feature

## Overview
When consultants close support tickets, they can now enter the number of hours worked. The system will automatically calculate the total amount based on the consultant's hourly rate and send detailed invoices to customers.

## 🔧 Technical Implementation

### Database Changes
**New fields added to `Order` entity:**
- `HoursWorked` (decimal?) - Actual hours worked by consultant
- `HourlyRate` (decimal?) - Consultant's hourly rate at time of completion (for historical accuracy)
- `CalculatedAmount` (decimal?) - Final calculated amount (HoursWorked × HourlyRate)

### API Changes
**Updated `UpdateStatusDto`:**
```csharp
public class UpdateStatusDto
{
    public string Status { get; set; }
    public string? Comment { get; set; }
    public decimal? HoursWorked { get; set; } // New field for hours worked
}
```

**Updated `SupportRequestDto`:**
```csharp
// New fields for work completion information
public decimal? HoursWorked { get; set; }
public decimal? HourlyRateAtCompletion { get; set; }
public decimal? CalculatedAmount { get; set; }
```

## 🎯 Business Logic

### Validation Rules
1. **Hours Required**: When closing a ticket (status: Completed, Closed, TopicClosed), hours worked is mandatory
2. **Hours Validation**: Hours worked must be greater than 0
3. **Rate Required**: Consultant must have an hourly rate set in their profile
4. **Automatic Calculation**: Amount = Hours Worked × Consultant's Hourly Rate

### Status Change Behavior
- **Before**: Consultants could close tickets without tracking work time
- **After**: Consultants must enter hours worked when closing tickets
- **Error Handling**: Clear error messages if validation fails

## 📧 Email Notifications

### Customer Email (Invoice)
**Subject**: "✅ Support Request Completed - Invoice #{OrderNumber}"
**Content**:
- Work completion confirmation
- Detailed work summary:
  - Hours worked
  - Hourly rate
  - **Total calculated amount**
- Professional invoice layout
- Link to view details and rate consultant

### Consultant Email (Earnings Summary)
**Subject**: "🎉 Ticket Completed - Earnings Summary #{OrderNumber}"
**Content**:
- Work completion confirmation
- Earnings breakdown:
  - Hours worked
  - Hourly rate
  - **Total earnings**
- Next steps information
- Link to dashboard

## 🔄 API Endpoint Usage

### Update Status with Hours Worked
**PUT** `/api/SupportRequests/{orderId}/status`

**Request Body:**
```json
{
    "status": "Completed",
    "comment": "Issue resolved successfully. Configured SAP system parameters and optimized performance.",
    "hoursWorked": 3.5
}
```

**Success Response:**
```json
{
    "message": "Status updated successfully"
}
```

**Error Response (Missing Hours):**
```json
{
    "error": "Hours worked is required when closing a ticket and must be greater than 0."
}
```

**Error Response (No Hourly Rate):**
```json
{
    "error": "Consultant must have an hourly rate set to calculate the final amount."
}
```

## 💡 Example Calculation

**Scenario:**
- Consultant hourly rate: $75.00
- Hours worked: 2.5 hours
- Calculated amount: $187.50

**Customer receives:**
```
Work Summary & Invoice
├── Hours Worked: 2.50 hours
├── Hourly Rate: $75.00 per hour
└── Total Amount: $187.50
```

**Consultant receives:**
```
Your Earnings Summary  
├── Hours Worked: 2.50 hours
├── Your Hourly Rate: $75.00 per hour
└── Total Earned: $187.50
```

## 🧪 Testing Scenarios

### Test Case 1: Successful Ticket Closure
1. Create support request
2. Assign consultant with hourly rate ($50/hour)
3. Change status to "Completed" with 2 hours worked
4. ✅ Expected: Amount calculated as $100.00, both emails sent

### Test Case 2: Missing Hours Worked
1. Try to close ticket without entering hours
2. ❌ Expected: Error "Hours worked is required when closing a ticket"

### Test Case 3: Invalid Hours (Zero/Negative)
1. Try to close ticket with 0 or negative hours
2. ❌ Expected: Error "Hours worked must be greater than 0"

### Test Case 4: Consultant Without Hourly Rate
1. Try to close ticket when consultant has no hourly rate set
2. ❌ Expected: Error "Consultant must have an hourly rate set"

### Test Case 5: Other Status Changes
1. Change status to "In-Progress" (no hours required)
2. ✅ Expected: Status changes normally, no hours validation

## 🎨 Frontend Integration Notes

The frontend will need to be updated to:

1. **Status Update Form**: Add hours input field when changing status to "Completed"
2. **Validation**: Client-side validation for hours > 0
3. **Display**: Show calculated amounts in ticket details
4. **Invoice View**: Display work summary with hours and amounts

### Example Frontend API Call:
```typescript
const closeTicket = async (orderId: string, hoursWorked: number, comment?: string) => {
    const response = await fetch(`/api/SupportRequests/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            status: 'Completed',
            hoursWorked: hoursWorked,
            comment: comment
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
    }
};
```

## 🔒 Security & Data Integrity

- **Historical Rate Storage**: Hourly rate is captured at completion time (prevents rate changes from affecting completed work)
- **Immutable Calculations**: Once calculated, amounts cannot be modified without admin intervention
- **Audit Trail**: All status changes and calculations are logged in StatusChangeLog
- **Validation**: Server-side validation prevents invalid data entry

## 📊 Benefits

1. **Transparency**: Customers see exactly what they're paying for
2. **Professional Invoicing**: Automated, detailed work summaries
3. **Consultant Earnings**: Clear earnings tracking and confirmation
4. **Business Intelligence**: Accurate data for hours worked and earnings analysis
5. **Audit Trail**: Complete record of work performed and charges

## 🚀 Deployment Status

✅ **Database Migration**: Applied (AddHoursWorkedAndCalculatedAmount)
✅ **Backend API**: Implemented with validation and email notifications  
✅ **Email Templates**: Professional templates for customers and consultants
⚠️ **Frontend**: Needs to be updated to include hours input field
⚠️ **Testing**: Ready for end-to-end testing