# Sap Basis Pulse API Documentation

## Overview

The Sap Basis Pulse API is a comprehensive REST API built with .NET 8, providing enterprise-grade support ticketing functionality with advanced security, performance, and scalability features.

## Base URL
```
https://your-backend-domain.com/api/
```

## Authentication

### JWT Bearer Token
All API requests require authentication using JWT Bearer tokens in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Authentication Endpoints

#### POST /api/auth/login
User login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "refresh-token-here",
  "user": {
    "id": "guid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "Customer"
  }
}
```

#### POST /api/auth/google-login
Google OAuth login.

**Request:**
```json
{
  "idToken": "google-id-token"
}
```

#### POST /api/auth/register
User registration.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password",
  "firstName": "John",
  "lastName": "Doe"
}
```

## Authorization

### Roles
- **Admin**: Full system access
- **Consultant**: Can manage own availability and assigned tickets
- **Customer**: Can create tickets and view own data

### Resource Ownership
All endpoints enforce resource ownership validation:
- Users can only access their own data
- Consultants can only manage their own availability
- Admins have full access to all resources

## API Endpoints

### Consultant Availability

#### GET /api/consultantavailability/consultant/{consultantId}
Get availability slots for a specific consultant.

**Authorization:** Customer, Consultant, Admin
**Query Parameters:**
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

**Response:**
```json
[
  {
    "id": "guid",
    "consultantId": "guid",
    "slotStartTime": "2025-01-01T10:00:00Z",
    "slotEndTime": "2025-01-01T11:00:00Z",
    "isBooked": false
  }
]
```

#### POST /api/consultantavailability
Create a new availability slot.

**Authorization:** Consultant, Admin
**Request:**
```json
{
  "consultantId": "guid",
  "startDate": "2025-01-01",
  "startTime": "10:00",
  "endTime": "11:00"
}
```

**Validation Rules:**
- Minimum 1 hour duration
- Start time must be in the future
- End time must be after start time

#### DELETE /api/consultantavailability/{id}
Delete an availability slot.

**Authorization:** Consultant (own slots), Admin

### Support Requests (Tickets)

#### GET /api/supportrequests/recent/user
Get recent tickets for the authenticated user.

**Authorization:** All authenticated users
**Query Parameters:**
- `search` (optional): Search term for filtering

**Response:**
```json
[
  {
    "id": "guid",
    "orderNumber": "SR-20250101-1234",
    "srIdentifier": "AUTO-SR-20250101-1234",
    "description": "Support request description",
    "status": "New",
    "priority": "Medium",
    "createdAt": "2025-01-01T09:00:00Z",
    "supportTypeName": "Technical Support",
    "consultantName": "John Doe"
  }
]
```

#### POST /api/supportrequests
Create a new support request.

**Authorization:** Customer, Admin
**Request:**
```json
{
  "description": "Detailed problem description",
  "priority": "High",
  "supportTypeId": "guid",
  "supportCategoryId": "guid",
  "supportSubOptionId": "guid",
  "consultantId": "guid",
  "timeSlotIds": ["guid1", "guid2"],
  "srIdentifier": "optional-custom-identifier"
}
```

#### PUT /api/supportrequests/{id}/status
Update ticket status.

**Authorization:** Consultant (assigned tickets), Admin
**Request:**
```json
{
  "status": "InProgress",
  "notes": "Status update notes"
}
```

### Messaging

#### GET /api/messaging/conversations
Get user conversations.

**Authorization:** All authenticated users

#### POST /api/messaging/messages
Send a message.

**Authorization:** All authenticated users
**Request:**
```json
{
  "conversationId": "guid",
  "content": "Message content",
  "messageType": "Text"
}
```

### Admin Endpoints

#### GET /api/admin/users
Get all users (paginated).

**Authorization:** Admin only
**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)
- `search` (optional): Search term

#### GET /api/admin/analytics
Get system analytics.

**Authorization:** Admin only

#### POST /api/admin/sso-config
Configure SSO settings.

**Authorization:** Admin only

## Error Handling

### Standard Error Response
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Bad Request",
  "status": 400,
  "detail": "Validation failed",
  "errors": {
    "fieldName": ["Error message"]
  }
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (business rule violation)
- `500` - Internal Server Error

## Validation Rules

### Availability Slots
- Minimum duration: 1 hour
- Maximum duration: 8 hours
- Start time must be in the future
- No overlapping slots for same consultant
- End time must be after start time

### Support Requests
- Description is required
- Priority must be: Low, Medium, High, VeryHigh
- At least one time slot must be selected
- SR Identifier required for certain support types

### User Input
- Email format validation
- Password strength requirements
- XSS protection on text inputs
- SQL injection prevention

## Rate Limiting

API endpoints are protected with rate limiting:
- Authenticated requests: 1000/hour
- Unauthenticated requests: 100/hour
- File uploads: 10/hour

## Security Features

### Data Protection
- All sensitive data encrypted at rest
- HTTPS required for all communications
- JWT tokens with configurable expiration
- Secure password hashing with bcrypt

### Audit Trail
All data modifications are tracked with:
- CreatedAt/CreatedBy timestamps
- UpdatedAt/UpdatedBy timestamps
- Soft delete with IsDeleted flag
- Comprehensive audit logging

### Input Validation
- Server-side validation with FluentValidation
- Business rule enforcement
- Sanitization of user inputs
- Type-safe data transfer objects

## Performance Optimizations

### Database
- Optimized queries with proper indexing
- Connection pooling
- Asynchronous operations
- Query result caching

### API
- Response compression (gzip)
- Pagination for large datasets
- Efficient serialization
- Request/response logging

## Monitoring

### Health Checks
- `GET /health` - Application health status
- `GET /health/database` - Database connectivity
- `GET /health/external` - External service availability

### Logging
- Structured logging with correlation IDs
- Performance monitoring
- Error tracking and alerting
- Security event logging

## SDKs and Tools

### Postman Collection
Import the provided Postman collection for easy API testing.

### OpenAPI Specification
Access the Swagger UI at `/swagger` for interactive API documentation.

## Support

For API support and questions:
- Check the error messages for detailed information
- Review the validation rules for request requirements
- Contact the development team for technical assistance</content>
<parameter name="filePath">e:\sap\sap-basis-pulse_OLD_deleted-main\API_DOCUMENTATION.md