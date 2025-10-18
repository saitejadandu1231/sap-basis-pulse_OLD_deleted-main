# Test Consultant Availability Slot Validations

## Test Cases to Verify

### Backend Validations (API Tests)

1. **Past Date/Time Validation**
   - Try creating a slot with yesterday's date (should fail)
   - Try creating a slot with current time (should work)
   - Try creating a slot in the future (should work)

2. **Duplicate/Overlapping Slot Validation**
   - Create a slot for 2:00 PM - 3:00 PM
   - Try creating another slot for 2:30 PM - 3:30 PM (should fail - overlap)
   - Try creating another slot for 2:00 PM - 3:00 PM (should fail - exact duplicate)
   - Try creating another slot for 1:30 PM - 2:30 PM (should fail - overlap)

3. **Duration Validations**
   - Try creating a slot less than 30 minutes (should fail)
   - Try creating a slot longer than 8 hours (should fail)
   - End time before start time (should fail)

### Frontend Validations (UI Tests)

1. **Date Input Constraints**
   - Date picker should not allow selecting past dates
   - Should show helpful message about minimum advance time

2. **Real-time Overlap Detection**
   - Should warn about overlapping slots before submission
   - Should list conflicting time ranges

3. **User Experience**
   - Clear error messages for validation failures
   - Form should reset after successful submission
   - Loading states during API calls

## API Endpoints to Test

```bash
# Create availability slot
POST /api/ConsultantAvailability
Content-Type: application/json
Authorization: Bearer {consultant_token}

{
  "consultantId": "{consultant_id}",
  "slotStartTime": "2025-10-16T14:00:00.000Z",
  "slotEndTime": "2025-10-16T15:00:00.000Z"
}
```

## Expected Error Messages

- **Past Time**: "Cannot create availability slots for past dates or times..."
- **Overlapping Slots**: "Cannot create slots that overlap with existing availability slots..."
- **Duration Too Short**: "Availability slots must be at least 30 minutes long"
- **Duration Too Long**: "Availability slots cannot be longer than 8 hours..."

## Validation Features Implemented

✅ **Backend Validations**
- Past date/time prevention (allows current time and future)
- Comprehensive overlap detection using time range queries
- Duration constraints (30 minutes minimum, 8 hours maximum)
- Data integrity validation at DTO level

✅ **Frontend Validations**
- Client-side date/time validation with immediate feedback
- Real-time overlap detection before API submission
- HTML5 input constraints (min date, time validation)
- User-friendly error messages with specific conflict details

✅ **Enhanced User Experience**
- Visual hints about validation rules
- Helpful guidance text under form inputs
- Detailed error messages explaining conflicts
- Prevention of common user errors before API calls