# Status Change Email Notification Feature

## Overview
When a consultant changes the status of a support request from "New" to "In-Progress", the system will automatically send email notifications to both the customer and the consultant.

## Implementation Details

### 📧 Email Notifications Triggered
- **Trigger Condition**: Status change from "New" → "In-Progress"
- **Recipients**: Customer (who created the request) + Consultant (who is assigned)
- **Email Service**: Uses existing IEmailSender service with Brevo integration

### 📋 Email Templates Added

#### 1. Customer Notification Email
- **Template**: `StatusChangedToInProgressForCustomer`
- **Subject**: "Status Update: Your Support Request #{OrderNumber} is Now In Progress"
- **Content**: 
  - Confirmation that their request is actively being worked on
  - Consultant name who is handling the request
  - Next steps and expectations
  - Link to view progress in dashboard

#### 2. Consultant Confirmation Email  
- **Template**: `StatusChangedToInProgressForConsultant`
- **Subject**: "Status Updated: Support Request #{OrderNumber} - In Progress"
- **Content**:
  - Confirmation of status change action
  - Customer information and request details
  - Next steps and responsibilities
  - Link to dashboard

### 🔧 Technical Implementation

#### Modified Files:
1. **EmailTemplates.cs** - Added new email templates
2. **SupportRequestService.cs** - Enhanced `UpdateStatusAsync()` method

#### Key Changes:
```csharp
// In UpdateStatusAsync method
if (oldStatusCode == "New" && status == "In-Progress")
{
    await SendStatusChangeToInProgressEmails(order, changedByUserId);
}

// New private method
private async Task SendStatusChangeToInProgressEmails(Order order, Guid changedByUserId)
{
    // Sends emails to both customer and consultant
    // Uses existing EmailTemplates with order details
    // Handles errors gracefully without failing status update
}
```

### 🎯 Business Logic
- **Only triggers** on "New" → "In-Progress" status changes
- **Requires**: Customer, Consultant, and SupportType data to be available
- **Error Handling**: Email failures do not prevent status updates from completing
- **Data Included**: Order number, customer name, consultant name, support type, priority, description

### 🧪 Testing Scenarios

#### Test Case 1: Successful Email Sending
1. Create a new support request (status = "New")
2. Assign consultant to the request
3. Consultant changes status to "In-Progress"
4. ✅ Both customer and consultant should receive emails

#### Test Case 2: Other Status Changes (No Email)
1. Change status from "In-Progress" → "Completed"
2. Change status from "New" → "Cancelled"
3. ❌ No emails should be sent

#### Test Case 3: Missing Data Handling
1. Status change with missing consultant data
2. Status change with missing customer data
3. ✅ Status update should succeed, emails should be skipped gracefully

#### Test Case 4: Email Service Failure
1. Email service is down/unavailable
2. Status change from "New" → "In-Progress"
3. ✅ Status update should still succeed, email failure should be logged

### 🚀 Deployment Notes
- No database changes required
- Uses existing email infrastructure
- Backward compatible with existing status change functionality
- Email templates are responsive and follow Yuktor branding

### 📊 Benefits
- **Customer Experience**: Immediate notification when work begins
- **Consultant Confirmation**: Clear confirmation of actions taken
- **Transparency**: Both parties know work has started
- **Professional Communication**: Automated, consistent messaging
- **Audit Trail**: Status changes still logged as before

## API Endpoint
**PUT** `/api/SupportRequests/{orderId}/status`

**Request Body:**
```json
{
    "status": "In-Progress",
    "comment": "Starting work on the issue"
}
```

When this endpoint is called with status "In-Progress" and the current status is "New", both email notifications will be automatically sent.