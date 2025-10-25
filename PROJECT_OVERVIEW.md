# SAP Basis Pulse - Project Overview

## 🎯 Project Summary
**SAP Basis Pulse** is a full-stack web application designed to manage SAP basis-related support requests, consultant availability, and customer interactions. It features user authentication (JWT + OAuth2), a real-time messaging system, payment integration, and comprehensive admin tools.

**Repository**: `sap-basis-pulse_OLD_deleted-main`
**Current Branch**: `bugs/bug3.0.0`

---

## 📊 Project Structure

```
├── backend/                    # .NET 8 Web API (C#)
│   ├── Program.cs             # Application startup configuration
│   ├── Controllers/           # API endpoints
│   ├── Services/              # Business logic layer
│   ├── Entities/              # Database models
│   ├── Data/                  # DbContext and migrations
│   ├── DTOs/                  # Data Transfer Objects
│   └── Middleware/            # Custom middleware
├── frontend/                  # React + TypeScript + Vite
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable UI components
│   │   ├── contexts/         # Context API (Auth, Theme)
│   │   ├── services/         # API client and business logic
│   │   ├── hooks/            # Custom React hooks
│   │   ├── types/            # TypeScript type definitions
│   │   └── lib/              # Utilities and helpers
│   └── index.html
├── scripts/                   # PowerShell scripts (testing, deployment)
└── [Migration & Config Files] # SQL migrations, Docker configs
```

---

## 🔧 Backend Architecture (.NET 8)

### **Key Technologies**
- **Framework**: ASP.NET Core 8.0 Web API
- **Database**: PostgreSQL (via Npgsql Entity Framework)
- **Authentication**: JWT Bearer + OAuth2 (Google, Apple, Supabase)
- **ORM**: Entity Framework Core 9.0
- **Email**: Brevo (formerly Sendinblue) SMTP
- **Payments**: Razorpay
- **Cloud**: Railway.app deployment

### **Database Entities** (`backend/Entities/`)
| Entity | Purpose |
|--------|---------|
| `User` | Core user model extending IdentityUser<Guid>. Has Role (Admin/Customer/Consultant) & Status |
| `SupportRequest` | Support tickets/service requests |
| `SupportTaxonomy` | Category hierarchy for support requests |
| `ServiceRequestIdentifier` | SR-specific identifiers for tracking |
| `ConsultantAvailabilitySlot` | Consultant working hours/availability |
| `ConsultantSkill` | Skills associated with consultants |
| `Message` | Real-time messaging between users |
| `Conversation` | Thread/group for messages |
| `Order` | Payment orders |
| `OrderTimeSlot` | Time slots for orders |
| `TicketRating` | Customer feedback on resolved tickets |
| `TicketSequence` | Ticket numbering sequences |
| `TicketNumberTemplate` | Customizable ticket ID formats |
| `AuditLog` | Activity logging for compliance |
| `SSOConfiguration` | Multi-provider SSO settings |
| `DomainRestriction` | Email domain whitelisting |
| `SystemSetting` | Global application settings |

### **Services** (`backend/Services/`)
| Service | Responsibility |
|---------|-----------------|
| `IAuthService` / `AuthService` | User authentication, JWT token generation, OAuth integration |
| `ISupportRequestService` | CRUD operations for support tickets |
| `IEmailSender` (BrevoEmailSender) | Email delivery via Brevo |
| `IConsultantAvailabilityService` | Manage consultant schedules |
| `ISupportTaxonomyService` | Support category management |
| `IMessagingService` | Real-time messaging/conversations |
| `IFileUploadService` | File upload handling |
| `ITicketRatingService` | Ticket feedback and ratings |
| `IPaymentService` (RazorpayPaymentService) | Payment processing |
| `ISystemSettingsService` | System-wide configuration |
| `IDomainRestrictionService` | Domain whitelist enforcement |
| `ISupabaseAuthService` | Supabase SSO integration |
| `IAuditLogService` | Activity audit trail |

### **Key API Endpoints** (`backend/Controllers/`)
- `AuthController` - Login, Register, OAuth Callback, Token Refresh
- `SupportRequestsController` - CRUD for support tickets
- `UsersController` - User profile management
- `AdminController` - Admin operations
- `SupportTaxonomyController` - Taxonomy management
- `ConsultantAvailabilityController` - Consultant scheduling
- `MessagingController` - Messaging/Conversations
- `PaymentController` - Payment operations
- `SSOConfigController` - SSO provider configuration
- `DomainRestrictionsController` - Domain whitelist management
- `SystemSettingsController` - Application settings

### **Authentication Flow**
1. **JWT-based**: Issued on login/OAuth, includes user claims (id, email, role, exp)
2. **OAuth2 Support**: Google, Apple, Supabase providers
3. **Token Validation**: Configurable expiry, issuer, audience
4. **Refresh Tokens**: Stored in database for token renewal

### **Startup Configuration** (`Program.cs`)
- Database connection: Railway `DATABASE_URL` → PostgreSQL
- CORS: Different policies for dev (`localhost:3000,8080,8081`) vs production
- Services registration (DI container)
- Middleware chain: Exception handling → CORS → Auth → Authorization
- SSO configuration initialization
- Database seeding (development only)

---

## 🎨 Frontend Architecture (React + TypeScript)

### **Key Technologies**
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: TanStack React Query + Context API
- **Styling**: Tailwind CSS + shadcn/ui components
- **UI Library**: shadcn/ui (Radix UI primitives)

### **App Structure** (`frontend/src/App.tsx`)
**Root Provider Stack**:
```
QueryClientProvider → ThemeProvider → AuthProvider → TooltipProvider
```

### **Authentication Context** (`frontend/src/contexts/AuthContext.tsx`)
```typescript
interface AuthContextType {
  user: User | null              // Current logged-in user
  token: string | null           // JWT Bearer token
  loading: boolean               // Auth state loading
  signIn(email, password, oauthData)   // Email/OAuth login
  signUp(email, password, ...)         // User registration
  signOut()                             // Logout
  refreshUser()                         // Sync user data
  updateUser(firstName, lastName)      // Profile update
}
```
**Features**:
- JWT token stored in localStorage
- Automatic token expiration check
- Seamless OAuth provider integration
- User data persistence across page reloads

### **Pages** (`frontend/src/pages/`)
| Page | Route | Protected | Purpose |
|------|-------|-----------|---------|
| `Index` | `/` | ❌ | Landing page |
| `Login` | `/login` | ❌ | User authentication |
| `AuthCallback` | `/auth/callback` | ❌ | OAuth provider callback |
| `ConfirmEmail` | `/confirm-email` | ❌ | Email verification |
| `Dashboard` | `/dashboard` | ✅ | User main dashboard |
| `SupportSelection` | `/support` | ✅ | Create support request |
| `Tickets` | `/tickets` | ✅ | View user's tickets |
| `ConsultantAvailability` | `/consultant/availability` | ✅ | Consultant schedules |
| `ConsultantSkills` | `/consultant/skills` | ✅ | Consultant skills matrix |
| `Messaging` | `/messages` | ✅ | Real-time conversations |
| `Settings` | `/settings` | ✅ | User preferences |
| `AdminDashboard` | `/admin` | ✅ | Admin overview |
| Admin pages | `/admin/*` | ✅ | User/Settings/SSO management |

### **Key Components**
- `ProtectedRoute` - Enforces authentication on protected pages
- `MessagingProtectedRoute` - Extra messaging-specific auth checks
- `PWAStatus` - Progressive Web App status indicator
- `ToasterUI` - Toast notifications (custom + Sonner)

### **Routing Strategy**
- **Public Routes**: Index, Login, OAuth callback, Policy pages
- **Protected Routes**: Dashboard and all admin/user pages
- **Catch-all**: 404 NotFound page

---

## 🔐 Security Features

### **Authentication**
- ✅ JWT Bearer tokens with HS256 signing
- ✅ Configurable token expiration
- ✅ Multi-provider OAuth2 (Google, Apple, Supabase)
- ✅ Refresh token mechanism

### **Authorization**
- ✅ Role-based access control (Admin, Customer, Consultant)
- ✅ Protected route enforcement on frontend
- ✅ API-level authorization checks

### **Data Protection**
- ✅ Email verification workflow
- ✅ Domain-based access restrictions
- ✅ Audit logging for compliance
- ✅ HTTPS/TLS termination (Railway)

---

## 📧 Email System

### **Providers Supported**
1. **Brevo** (Primary) - SMTP integration
2. **Gmail API** - Alternative provider
3. **Custom SMTP** - Generic provider support

### **Email Templates** (`backend/Services/EmailTemplates.cs`)
- Welcome/Onboarding
- Email verification
- Password reset
- Status change notifications
- Ticket updates

---

## 💳 Payment Integration

### **Razorpay**
- Order creation and tracking
- Payment gateway integration
- Order time slot management
- Payment status webhooks

---

## 📱 Progressive Web App (PWA)

- Web app installable on mobile/desktop
- Offline support capabilities
- PWA status indicator component

---

## 🚀 Deployment & Environment

### **Production Environment**: Railway.app
- **Database**: Railway PostgreSQL
- **Backend Hosting**: Railway Node (Docker)
- **Frontend Hosting**: Vercel (typical)
- **Environment Variables**: `DATABASE_URL`, `CORS_ORIGINS`, JWT secrets, OAuth credentials

### **Development Environment**
- **Database**: Local PostgreSQL or Docker
- **Backend**: `dotnet run` on port 5001
- **Frontend**: `npm run dev` on port 3000/8080
- **Database Seeding**: Automatic on startup

---

## 🛠️ Key Features

### **User Management**
- Multi-role system (Admin, Customer, Consultant)
- Email/OAuth registration
- Profile management with hourly rates (consultants)
- User status tracking (PendingVerification, Active, Inactive, Suspended)

### **Support Ticket System**
- Hierarchical taxonomy (categories/subcategories)
- Custom ticket numbering with templates
- Ticket rating and feedback
- Support request identifiers for tracking
- Status change workflows with email notifications

### **Consultant Features**
- Availability scheduling (time slots)
- Skill matrix management
- Hourly rate configuration
- Customer choice preferences

### **Real-time Messaging**
- User-to-user conversations
- File attachments
- Message threading

### **Admin Tools**
- User management and role assignment
- Support taxonomy editor
- Ticket number template configuration
- SSO provider settings
- Domain-based access control
- System settings and configuration

### **Analytics** (Planned/Partial)
- Usage tracking via AuditLog
- Ticket statistics
- Consultant performance metrics

---

## 📦 Database Schema Highlights

### **Key Relationships**
- User → ConsultantAvailabilitySlot (1-to-many)
- User → Order (1-to-many)
- SupportRequest → TicketRating (1-to-1)
- Conversation → Message (1-to-many)
- SupportTaxonomy (self-referencing hierarchy)
- TicketSequence (per-taxonomy ticket numbering)

### **Important Tables**
- `aspnetusers` - Identity users (extended with FirstName, LastName, etc.)
- `aspnetroles` - Identity roles
- `aspnetuserclaims`, `aspnetseriallogs` - Audit trail
- `SupportRequests` - Main ticket table
- `SystemSettings` - Application configuration
- `SSOConfigurations` - OAuth provider enablement
- `DomainRestrictions` - Email domain filters

---

## 🔄 Current Development Status

**Current Branch**: `bugs/bug3.0.0` - Indicates ongoing bug fixes for version 3.0.0

### **Recent Implementation Areas**
- Email verification workflow
- Admin dashboard and user management
- SSO configuration and management
- Domain restrictions and access control
- Consultant availability and skills
- Messaging system with file attachments

---

## 📚 Documentation Files

Key documentation in workspace:
- `PRODUCTION_DEPLOYMENT_GUIDE.md` - Deployment procedures
- `SSO_IMPLEMENTATION.md` - OAuth setup details
- `EMAIL_SETUP_GUIDE.md` - Email provider configuration
- `BREVO_SETUP_GUIDE.md` - Brevo integration
- `ADMIN_EMAIL_VERIFICATION_IMPLEMENTATION.md` - Email verification features
- `CONSULTANT_AVAILABILITY_VALIDATION_TESTS.md` - Testing specs

---

## 🎓 Understanding the Code Flow

### **User Registration Flow**
1. Frontend: `Login` page → `signUp()` in AuthContext
2. Backend: `AuthController.Register()` → Create User entity
3. Database: Insert into `aspnetusers` with status = PendingVerification
4. Email: Send verification email via BrevoEmailSender
5. Frontend: Navigate to `/confirm-email` page

### **Login Flow**
1. Frontend: `Login` page → `signIn()` with email/password
2. Backend: `AuthService.AuthenticateAsync()` → Validate credentials
3. Backend: Generate JWT token with user claims
4. Frontend: Store token in localStorage, update AuthContext
5. Frontend: Redirect to `/dashboard`

### **Support Request Creation Flow**
1. Frontend: `/support` → `SupportSelection` page
2. Frontend: Select category (from `SupportTaxonomy`)
3. Backend: `SupportRequestsController.CreateAsync()`
4. Database: Create `SupportRequest` entry, assign unique ticket number
5. Email: Notify admin and customer
6. Frontend: Redirect to `/tickets` with confirmation

### **Admin Page Flow**
1. Frontend: Auth check - require role = "Admin"
2. Frontend: Render `/admin` dashboard with management options
3. Backend: Admin endpoints validate role via JWT claims
4. Database: Query and return sensitive data (users, requests, configs)

---

## 🤔 Questions to Explore Further

Would you like me to dive deeper into any specific area?

- **Backend**: Services, database queries, API endpoints, authentication flow
- **Frontend**: Component hierarchy, state management, routing patterns
- **Specific Features**: Messaging system, payment integration, SSO flows
- **Deployment**: Railway configuration, environment setup, database migrations
- **Bug Fixes**: Current issues in `bugs/bug3.0.0` branch

---

**Last Updated**: October 25, 2025
