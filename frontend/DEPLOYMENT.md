36# Vercel Deployment Checklist

## ✅ Pre-Deployment Checklist

### 📁 Files Created/Updated:
- [x] `.env.production` - Production environment variables
- [x] `.env.local` - Local development environment variables  
- [x] `vercel.json` - Vercel deployment configuration
- [x] `.vercelignore` - Files to ignore during deployment
- [x] `vite.config.ts` - Updated with build optimizations
- [x] `package.json` - Updated with additional scripts
- [x] `README.md` - Updated deployment documentation

### 🔧 Configuration Details:

#### Environment Variables:
```bash
VITE_API_URL=http://localhost:5274  # Will be updated after backend deployment
```

#### Vercel Settings:
- **Framework**: Vite (auto-detected)
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Node.js Version**: 18.x

## 🚀 Deployment Steps:

### Step 1: Test Local Build
```bash
cd frontend
npm install
npm run build
npm run preview  # Test the built version locally
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Configure:
   - **Root Directory**: `frontend`
   - **Framework**: Vite (should auto-detect)
   - **Build Settings**: Use defaults
   - **Environment Variables**: Add `VITE_API_URL`
6. Click "Deploy"

### Step 3: Verify Deployment
- [ ] Landing page loads correctly
- [ ] Navigation works (all routes)
- [ ] Theme toggle functions
- [ ] Mobile responsiveness
- [ ] All static assets load
- [ ] Console has no critical errors

### Step 4: Post-Deployment Updates
After backend deployment:
- [ ] Update `VITE_API_URL` in Vercel dashboard
- [ ] Test API connectivity
- [ ] Update CORS settings in backend

## 🔗 Important URLs:

- **Local Development**: http://localhost:8080
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Your App**: https://your-app.vercel.app (after deployment)

## 🐛 Common Issues & Solutions:

### Build Fails:
- Check all dependencies are in `package.json`
- Ensure TypeScript types are correct
- Verify all imports use correct paths

### Environment Variables Not Working:
- Must start with `VITE_` prefix
- Check spelling in both `.env` files and Vercel dashboard
- Redeploy after adding new variables

### Routing Issues (404 on refresh):
- `vercel.json` includes SPA rewrite rules
- All routes should redirect to `/index.html`

### API Connection Issues:
- CORS configuration in backend
- Correct API URL in environment variables
- Check network tab for failed requests

## 📞 Support:

If you encounter issues:
1. Check Vercel deployment logs
2. Verify all configuration files are correct
3. Test local build first
4. Check browser console for errors