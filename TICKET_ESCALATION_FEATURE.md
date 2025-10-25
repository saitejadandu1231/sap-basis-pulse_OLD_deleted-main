# Ticket Escalation Feature

## Overview

The **Escalate** status has been added to the ticket management system, allowing both **Consultants** and **Customers** to escalate support tickets that require urgent or specialized attention from senior administrators.

When a ticket is escalated, an automatic notification email is sent to all admins with complete ticket details and the escalation reason.

## Features

### ✨ Key Features

1. **Escalate Status Added**: New status option for urgent/complex tickets
2. **Multi-Role Support**: Both consultants and customers can escalate
3. **Automatic Admin Notification**: All admins notified via email when ticket is escalated
4. **Escalation Context**: Includes reason, ticket details, and clear call-to-action
5. **Visual Indicator**: Red status badge (destructive variant) for high visibility
6. **Audit Logging**: All escalations tracked in audit logs

## Usage

### For Consultants

**When to Escalate:**
- Technical complexity beyond current expertise
- Customer request requires management decision
- Unusual or critical situation needing immediate attention
- Require higher priority handling

**How to Escalate:**
1. Open the ticket detail view
2. Go to the "Status Manage" tab
3. Select "Escalate" from the status dropdown
4. Enter escalation reason in the comment field (required)
5. Submit - admins are automatically notified

```
Example escalation reasons:
- "Technical issue beyond current consultant expertise, requires senior SAP BASIS team"
- "Customer requesting emergency maintenance window"
- "Security-related configuration issue, needs compliance review"
- "Database corruption, requires backup strategy discussion"
```

### For Customers

**When to Escalate:**
- Unsatisfied with current support progress
- Need immediate senior attention
- Ticket reopened but still unresolved
- Critical business impact requiring escalation

**How to Escalate:**
1. Open the ticket detail view
2. Go to the "Status Manage" tab
3. Select "Escalate" from the status dropdown
4. Enter escalation reason/concern in the comment field
5. Submit - admins are automatically notified

```
Example escalation reasons from customers:
- "No progress in 5 days, need immediate action"
- "This is critical for our production system"
- "Previous resolution didn't work, need expert review"
- "Requires decision-making level approval"
```

### For Admins

**Receiving Escalations:**
1. Receive email notification immediately when ticket is escalated
2. Email includes:
   - **Ticket ID** and order number
   - **Customer** and assigned consultant names
   - **Support type** and priority level
   - **Escalation reason** (showing who escalated: Consultant or Customer)
   - **Action required** recommendations
   - **Direct link** to ticket in dashboard

**Handling Escalated Tickets:**
1. Review the escalation reason and ticket history
2. Options:
   - Assign to senior consultant
   - Handle directly if you have expertise
   - Coordinate with team for resolution
   - Contact customer for additional context
3. Update ticket status and keep customer informed

## Technical Implementation

### Database Changes

**Migration: `20251025_AddEscalateStatus.cs`**

Adds new status to `StatusMaster` table:
```
StatusCode: "Escalate"
StatusName: "Escalate"  
Description: "Issue has been escalated to senior support team"
ColorCode: "bg-red-500"
IconCode: "AlertTriangle"
SortOrder: 7
IsActive: true
```

### Email Notification

**Template: `EmailTemplates.TicketEscalatedToAdminNotification()`**

Sends comprehensive escalation email to all admins including:
- Red warning header with clear "ESCALATED" indicator
- Complete ticket details in structured format
- Escalation reason in highlighted box
- Clear action items and recommendations
- Direct dashboard link for quick access

### Backend Changes

**File: `SupportRequestsController.cs`**

New method: `SendEscalationEmailToAdmin()`
- Triggered when status changes to "Escalate"
- Queries all admin users
- Sends individual emails to each admin
- Includes context about who escalated (Consultant or Customer)

### Frontend Changes

**File: `Tickets.tsx`**

Updated status filtering logic:
- **Consultants**: Can escalate from any non-closed state
- **Customers**: Can escalate from any state
- **Admins**: Can use any status

Updated status display:
- Escalate status shows with red icon and destructive badge
- Included in status history and filters

## Status Transition Rules

### Consultant Status Transitions

| From State | Can Change To | Special Rules |
|-----------|---------------|---------------|
| New | InProgress, PendingCustomerAction, **Escalate** | Can escalate anytime except from closed states |
| InProgress | PendingCustomerAction, Completed, TopicClosed, **Escalate** | Can escalate to seek help |
| PendingCustomerAction | InProgress, Completed, **Escalate** | Can escalate if customer unresponsive |
| Closed/TopicClosed | — | Locked, only customer can reopen |

### Customer Status Transitions

| From State | Can Change To | Special Rules |
|-----------|---------------|---------------|
| PendingCustomerAction | InProgress, **Escalate** | Can escalate if unresolved |
| Closed/TopicClosed | ReOpened, **Escalate** | Can reopen or escalate |
| Any other state | **Escalate** | Can always escalate if needed |

### Admin Status Transitions

- **Admins**: Can transition to any status for operational needs

## Email Template Details

### Recipient
- **All users with Admin role**

### Email Structure

1. **Header (Red, gradient background)**
   - Icon: ⚠️ ESCALATED
   - Title: "TICKET ESCALATED"
   - Subtitle: "Immediate action required - Senior support needed"

2. **Ticket Details Box**
   - Order number
   - Customer name
   - Current consultant
   - Support type
   - Priority level
   - Status: 🚨 ESCALATED

3. **Escalation Reason Box**
   - Shows exact reason provided
   - Includes who escalated (Consultant/Customer)
   - Highlighted in yellow background

4. **Action Required Section**
   - Red background with bold "ACTION REQUIRED" header
   - Lists recommended actions:
     - Assign to senior SAP BASIS consultant
     - Handle directly if expertise available
     - Coordinate with team
     - Update customer

5. **Call-to-Action Button**
   - Red button: "Review Escalated Ticket"
   - Links directly to ticket in dashboard

6. **Next Steps**
   - Review ticket history
   - Understand why it was escalated
   - Take appropriate action
   - Keep customer informed
   - Update ticket status

## Business Rules

### Escalation Permissions
✅ **Can Escalate:**
- Consultants (from any active ticket)
- Customers (from any ticket)
- Admins (can escalate or re-escalate)

❌ **Cannot Escalate:**
- Users without proper role
- On already-escalated tickets (prevent re-escalation, instead update status)

### Escalation Requirements
- **Reason is recommended** (captured in comment field)
- User role is noted in escalation reason
- Timestamp recorded automatically
- All admins notified

### Following Escalation
- Admins must review and take action
- Update ticket status to reflect resolution
- Document actions taken in comments
- Keep all parties informed

## Audit Logging

All escalations are logged in `AuditLogs`:
```
Action: "UpdateTicketStatus"
Details: "Status changed to Escalate. Comment: [escalation reason]"
Timestamp: Auto-recorded
UserId: Who escalated
IpAddress: Request source
```

## Testing

### Test Case: Consultant Escalates Ticket

1. Login as Consultant
2. Open an InProgress ticket
3. Click "Status Manage" tab
4. Select "Escalate" from dropdown
5. Enter reason: "Technical issue requires senior expertise"
6. Submit
7. ✅ Verify: All admins receive escalation email
8. ✅ Verify: Ticket status shows red "Escalate" badge
9. ✅ Verify: Audit log records the escalation

### Test Case: Customer Escalates Ticket

1. Login as Customer
2. Open a ticket in any state
3. Click "Status Manage" tab
4. Select "Escalate" from dropdown
5. Enter reason: "No progress, need immediate help"
6. Submit
7. ✅ Verify: All admins receive escalation email
8. ✅ Verify: Ticket status shows red "Escalate" badge
9. ✅ Verify: Admin name visible as initiator

### Test Case: Admin Reviews Escalation

1. Login as Admin
2. Check email for escalation notification
3. Click button in email to go to ticket
4. Review complete ticket history
5. Update status and add resolution comment
6. ✅ Verify: Ticket history updated
7. ✅ Verify: Customer notified of next steps

## FAQ

### Q: Can multiple escalations be sent for same ticket?
**A:** No, once escalated, changing to another status and back would send another notification. Only escalate once with clear reason.

### Q: Who receives the escalation email?
**A:** All users with the "Admin" role receive the notification.

### Q: Can escalation be automated?
**A:** Currently manual. Could be enhanced to auto-escalate based on SLA/time thresholds.

### Q: What if reason is missing?
**A:** Comment field is optional but recommended. Best practice is always include reason.

### Q: Can admin un-escalate?
**A:** Yes, admin can change status to another status like InProgress or move it to any valid status.

## Configuration

### Email Template Colors
- Header: Red gradient (`#e74c3c` to `#c0392b`)
- Icon: Red alert (`#e74c3c`)
- Highlights: Yellow box (`#fff3cd`) for reason
- Urgent: Light red (`#f8d7da`) for action required

### Status Display
- Icon: AlertTriangle (red)
- Badge: Destructive variant
- Color: bg-red-500

## Future Enhancements

1. **Auto-Escalation**: After X hours with no progress
2. **SLA Tracking**: Auto-escalate high-priority tickets after time limit
3. **Escalation History**: Track all escalations for analytics
4. **Escalation Levels**: Priority levels (Normal, Urgent, Critical)
5. **Escalation Queue**: Dedicated view for pending escalations
6. **Escalation Callback**: Notify requester when escalation resolved
7. **Custom Templates**: Allow admins to customize escalation email templates

## Support

For issues or questions about escalation feature:
1. Check ticket history for escalation status changes
2. Review email notifications received
3. Contact admin team for escalation handling
4. View audit logs for escalation timeline

---

**Status**: ✅ Live  
**Release Date**: October 25, 2025  
**Version**: 1.0  
**Maintained By**: Development Team
