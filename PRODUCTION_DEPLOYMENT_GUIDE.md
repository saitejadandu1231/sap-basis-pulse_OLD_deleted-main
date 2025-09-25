# Production Deployment Guide

## 🚀 Production Readiness Checklist

### ✅ Database & Migrations
- [x] All migrations are in place and tested
- [x] SSO Configuration table (`SSOConfigurations`) is ready
- [x] Service Request Identifiers are configured
- [x] Support taxonomy data is seeded

### ✅ Frontend Configuration
- [x] Production build works (`npm run build:prod`)
- [x] Vercel deployment configuration ready
- [x] Environment variables configured

### ⚠️ Backend Security Configuration
- [ ] **CRITICAL**: Update JWT_SECRET in production
- [ ] **CRITICAL**: Set secure CORS_ORIGINS
- [ ] **CRITICAL**: Configure production database connection
- [ ] **CRITICAL**: Set OAuth provider credentials

### 🐳 Docker & Deployment
- [x] Dockerfile optimized for Railway
- [x] Railway configuration ready
- [ ] **ACTION NEEDED**: Set production environment variables

---

## 🔧 Required Production Environment Variables

### Backend (Railway)
```bash
# Database (automatically provided by Railway PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:port/dbname

# Application Environment
ASPNETCORE_ENVIRONMENT=Production

# JWT Configuration (CRITICAL - Generate new secret!)
JWT_SECRET=your_super_secure_jwt_secret_at_least_256_bits_long_for_production

# CORS Configuration (Update after frontend deployment)
CORS_ORIGINS=https://your-vercel-app.vercel.app,https://your-custom-domain.com

# OAuth Providers
GOOGLE_CLIENT_ID=your_production_google_client_id
GOOGLE_CLIENT_SECRET=your_production_google_client_secret

# Supabase Configuration
SUPABASE_URL=https://zbsfyxakypvuftxntywm.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic2Z5eGFreXB2dWZ0eG50eXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MzEyMzMsImV4cCI6MjA3NDIwNzIzM30.xver5QMRzmuHURhZQgqZM9NUqp6janSl-JTWFI7nfSc

# SMTP Configuration (Production)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USERNAME=your_smtp_username
SMTP_PASSWORD=your_smtp_password
SMTP_FROM=noreply@yourdomain.com
SMTP_ENABLE_SSL=true
```

### Frontend (Vercel)
```bash
# Backend API URL (Update after Railway deployment)
VITE_API_URL=https://your-railway-app.railway.app

# Supabase Configuration
VITE_SUPABASE_URL=https://zbsfyxakypvuftxntywm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic2Z5eGFreXB2dWZ0eG50eXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MzEyMzMsImV4cCI6MjA3NDIwNzIzM30.xver5QMRzmuHURhZQgqZM9NUqp6janSl-JTWFI7nfSc
```

---

## 📦 Deployment Steps

### Step 1: Deploy Backend to Railway

1. **Create Railway Project**
   ```bash
   npm install -g @railway/cli
   railway login
   railway create sap-basis-pulse-backend
   ```

2. **Add PostgreSQL Database**
   ```bash
   railway add postgresql
   ```

3. **Set Environment Variables**
   ```bash
   railway variables set ASPNETCORE_ENVIRONMENT=Production
   railway variables set JWT_SECRET=your_super_secure_jwt_secret_at_least_256_bits_long
   railway variables set GOOGLE_CLIENT_ID=your_google_client_id
   railway variables set GOOGLE_CLIENT_SECRET=your_google_client_secret
   railway variables set CORS_ORIGINS=https://localhost:3000  # Update after frontend deployment
   ```

4. **Deploy Backend**
   ```bash
   cd backend
   railway up
   ```

5. **Note the Railway URL** for frontend configuration

### Step 2: Deploy Frontend to Vercel

1. **Update Frontend Environment**
   Create `.env.production` with Railway backend URL:
   ```bash
   VITE_API_URL=https://your-railway-app.railway.app
   VITE_SUPABASE_URL=https://zbsfyxakypvuftxntywm.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. **Deploy to Vercel**
   ```bash
   cd frontend
   npm install -g vercel
   vercel --prod
   ```

3. **Set Environment Variables in Vercel Dashboard**
   - Go to Vercel project settings
   - Add environment variables for production

### Step 3: Update CORS Configuration

1. **Update Railway Environment**
   ```bash
   railway variables set CORS_ORIGINS=https://your-vercel-app.vercel.app
   ```

2. **Redeploy Backend**
   ```bash
   railway redeploy
   ```

### Step 4: Configure OAuth Providers

1. **Google OAuth Console**
   - Add Railway URL to authorized origins
   - Add Vercel URL to authorized origins
   - Update redirect URIs

2. **Supabase Configuration**
   - Update site URL to Vercel URL
   - Configure OAuth providers

---

## 🔒 Security Checklist

### JWT Security
- [ ] Generate strong JWT secret (256+ bits)
- [ ] Verify JWT expiration times are appropriate
- [ ] Ensure JWT secret is stored securely

### Database Security
- [ ] Use production database with proper credentials
- [ ] Enable SSL/TLS for database connections
- [ ] Regularly backup database

### HTTPS & SSL
- [ ] Ensure all communications use HTTPS
- [ ] Verify SSL certificates are valid
- [ ] Configure security headers

### OAuth Security
- [ ] Use production OAuth credentials
- [ ] Verify redirect URIs are secure
- [ ] Test OAuth flow in production

---

## 🧪 Testing in Production

### Smoke Tests
1. **Health Check**: Visit `https://your-backend.railway.app/health`
2. **Frontend Load**: Visit `https://your-frontend.vercel.app`
3. **Authentication**: Test login/signup flow
4. **SSO**: Test Google OAuth integration
5. **API**: Test backend API endpoints

### Monitoring
- Set up Railway monitoring
- Configure Vercel analytics
- Monitor error rates and performance

---

## 🚨 Critical Security Updates Needed

### Immediate Actions Required:

1. **Generate Production JWT Secret**
   ```bash
   # Generate a secure 256-bit secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Update appsettings.Production.json**
   - Remove placeholder values
   - Configure proper connection string format

3. **Set Secure Headers**
   - Verify security headers in Vercel configuration
   - Add HSTS headers if using custom domain

---

## 📊 Performance Optimization

### Backend
- [x] Enable gzip compression
- [x] Configure connection pooling
- [x] Optimize EF Core queries

### Frontend
- [x] Bundle optimization with Vite
- [x] Static asset caching
- [x] Code splitting implemented

---

## 🔄 Post-Deployment Tasks

1. **Update DNS** (if using custom domain)
2. **Configure monitoring and logging**
3. **Set up automated backups**
4. **Test all authentication flows**
5. **Verify SSO configuration in admin panel**
6. **Monitor application logs for errors**

---

## 📞 Support & Troubleshooting

### Common Issues
- **CORS Errors**: Update CORS_ORIGINS environment variable
- **OAuth Failures**: Verify redirect URIs match exactly
- **Database Connection**: Check DATABASE_URL format
- **JWT Errors**: Ensure JWT_SECRET is properly set

### Log Locations
- **Railway Logs**: Available in Railway dashboard
- **Vercel Logs**: Available in Vercel project dashboard
- **Application Logs**: Structured logging enabled

---

## 🎯 Ready for Production?

Current Status: **ALMOST READY** ⚠️

**Completed:**
- ✅ Code is production-ready
- ✅ Database migrations ready
- ✅ Frontend builds successfully
- ✅ Docker configuration ready
- ✅ SSO implementation complete

**Pending Actions:**
- ⚠️ Set production environment variables
- ⚠️ Deploy to Railway/Vercel
- ⚠️ Update OAuth redirect URIs
- ⚠️ Test production deployment

**Next Steps:**
1. Set up Railway project and PostgreSQL
2. Configure production environment variables
3. Deploy backend to Railway
4. Deploy frontend to Vercel
5. Update CORS and OAuth configurations
6. Run production smoke tests

Your application is **code-complete and ready for deployment**! The remaining tasks are deployment configuration and environment setup.