# Sap Basis Pulse - Backend API

A comprehensive .NET 8 Web API backend for the Yuktor enterprise support ticketing system.

## 🚀 Features

### Core Functionality
- **User Management**: Authentication and authorization with role-based access
- **Support Ticketing**: Complete ticket lifecycle management
- **Consultant Availability**: Time slot management and booking system
- **Real-time Messaging**: Integrated messaging system for ticket communication
- **SSO Integration**: Google OAuth and custom SSO provider support

### Security & Compliance
- **JWT Authentication**: Secure token-based authentication
- **Role-based Authorization**: Admin, Consultant, and Customer roles
- **Resource Ownership Validation**: Comprehensive authorization checks
- **Input Validation**: FluentValidation with business rules
- **Audit Trails**: Complete audit logging for data integrity

### Database Features
- **PostgreSQL**: Robust relational database with Entity Framework Core
- **Audit Fields**: CreatedAt, CreatedBy, UpdatedAt, UpdatedBy tracking
- **Soft Deletes**: IsDeleted flag for data preservation
- **Optimized Queries**: Composite indexes and efficient data access

### Performance & Reliability
- **Error Handling**: Comprehensive logging and structured error responses
- **Caching**: Optimized query performance
- **Async Operations**: Non-blocking I/O operations throughout

## 🏗️ Architecture

### Project Structure
```
backend/
├── Controllers/          # API endpoints
├── Data/                # Entity Framework context and migrations
├── DTOs/                # Data transfer objects
├── Entities/            # Domain models
├── Services/            # Business logic layer
├── Utilities/           # Helper classes and utilities
├── Properties/          # Launch settings and configurations
└── appsettings.json     # Application configuration
```

### Key Components

#### Controllers
- `AuthController`: Authentication and user management
- `ConsultantAvailabilityController`: Availability slot management
- `SupportRequestsController`: Ticket operations
- `AdminController`: Administrative functions
- `MessagingController`: Real-time messaging

#### Services
- `AuthorizationService`: Resource ownership and role validation
- `ConsultantAvailabilityService`: Availability business logic
- `SupportRequestService`: Ticket processing and management
- `UserService`: User operations and authentication

#### Data Layer
- `AppDbContext`: EF Core context with relationships and configurations
- Comprehensive migrations with rollback support
- Optimized indexes for query performance

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/dbname

# JWT
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRY_HOURS=24

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# CORS
CORS_ORIGINS=https://your-frontend-domain.com

# Email (Optional)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USERNAME=your_smtp_username
SMTP_PASSWORD=your_smtp_password
```

### Database Setup
1. Ensure PostgreSQL is running
2. Update connection string in `appsettings.json`
3. Run migrations: `dotnet ef database update`

## 🚀 Getting Started

### Prerequisites
- .NET 8 SDK
- PostgreSQL database
- Node.js (for frontend development)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd backend

# Restore dependencies
dotnet restore

# Update database
dotnet ef database update

# Run the application
dotnet run
```

### Development
```bash
# Watch mode for development
dotnet watch run

# Build for production
dotnet publish -c Release
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/google-login` - Google OAuth login
- `POST /api/auth/refresh` - Token refresh

### Consultant Availability
- `GET /api/consultantavailability/consultant/{id}` - Get consultant slots
- `POST /api/consultantavailability` - Create availability slot
- `DELETE /api/consultantavailability/{id}` - Delete slot

### Support Requests
- `GET /api/supportrequests/recent/user` - User's tickets
- `POST /api/supportrequests` - Create new ticket
- `PUT /api/supportrequests/{id}/status` - Update ticket status

### Admin Endpoints
- `GET /api/admin/users` - User management
- `GET /api/admin/analytics` - System analytics
- `POST /api/admin/sso-config` - SSO configuration

## 🔒 Security Features

### Authorization Policies
- `AdminOnly`: Administrative access only
- `ConsultantOrAdmin`: Consultant and admin access
- `CustomerOrConsultantOrAdmin`: All authenticated users
- `ResourceOwner`: Resource ownership validation

### Validation Rules
- Minimum 1-hour availability slots
- Future date validation for bookings
- Business rule enforcement with FluentValidation
- Input sanitization and XSS protection

## 📊 Monitoring & Logging

### Structured Logging
- Request/response logging
- Error tracking with correlation IDs
- Performance monitoring
- Security event logging

### Health Checks
- Database connectivity
- External service availability
- Application health endpoints

## 🧪 Testing

### Unit Tests
```bash
dotnet test
```

### Integration Tests
```bash
# Run with test database
dotnet test --filter "Category=Integration"
```

## 📦 Deployment

### Docker
```bash
# Build image
docker build -t sap-basis-pulse-backend .

# Run container
docker run -p 8080:80 sap-basis-pulse-backend
```

### Railway Deployment
1. Connect GitHub repository
2. Add PostgreSQL database
3. Set environment variables
4. Deploy automatically

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with proper tests
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
