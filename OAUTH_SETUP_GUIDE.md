# OAuth Provider Setup Guide

## Current Status
✅ Backend SSO implementation complete
✅ Frontend SSO components ready
❌ OAuth providers not configured in Supabase (causing validation_failed error)

## Error Details
When clicking Google/Apple buttons: `{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}`

This means the SSO flow is working correctly, but Supabase doesn't have the OAuth providers enabled.

## Setup Steps

### 1. Google OAuth Setup

#### A. Google Cloud Console Setup
1. Go to https://console.cloud.google.com/
2. Create a new project or select existing one
3. Enable Google+ API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Choose "Web application"
   - Set authorized redirect URI: `https://zbsfyxakypvuftxntywm.supabase.co/auth/v1/callback`

#### B. Supabase Configuration
1. Go to https://supabase.com/dashboard
2. Select your project: `zbsfyxakypvuftxntywm`
3. Navigate to "Authentication" > "Providers"
4. Find "Google" and click "Configure"
5. Toggle "Enable sign in with Google" to ON
6. Enter the Client ID and Client Secret from Google Cloud Console
7. Save configuration

### 2. Apple OAuth Setup (Optional)

#### A. Apple Developer Setup
1. Apple Developer account required ($99/year)
2. Create App ID in Apple Developer Console
3. Create Service ID for Sign in with Apple
4. Configure domains and redirect URLs
5. Generate private key for authentication

#### B. Supabase Configuration
1. In Supabase Dashboard: Authentication > Providers > Apple
2. Toggle "Enable sign in with Apple" to ON
3. Enter Service ID, Team ID, Key ID, and Private Key from Apple Developer
4. Save configuration

### 3. Testing the Setup

Once providers are configured:

1. Revert the temporary button changes in `SSOButtons.tsx`
2. Test the Google sign-in flow
3. Verify user creation with role selection
4. Test admin SSO configuration management

### 4. Reverting Button Changes

After configuring providers, restore the original button code:

```tsx
<div className="grid grid-cols-2 gap-3">
  {ssoConfig.googleEnabled && (
    <Button
      variant="outline"
      onClick={handleGoogleSignIn}
      disabled={disabled}
      className="w-full"
    >
      <GoogleIcon />
      Google
    </Button>
  )}
  
  {ssoConfig.appleEnabled && (
    <Button
      variant="outline"
      onClick={handleAppleSignIn}
      disabled={disabled}
      className="w-full"
    >
      <AppleIcon />
      Apple
    </Button>
  )}
</div>
```

## Important Notes

- The redirect URI must exactly match: `https://zbsfyxakypvuftxntywm.supabase.co/auth/v1/callback`
- Google Cloud Console and Supabase must both be configured
- Apple Sign In requires a paid Apple Developer account
- Test in both development and production environments
- Keep OAuth credentials secure and never commit them to version control

## Environment Variables (Already Configured)

```
VITE_SUPABASE_URL=https://zbsfyxakypvuftxntywm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Troubleshooting

- **validation_failed**: OAuth provider not enabled in Supabase
- **invalid_client**: Client ID/Secret mismatch
- **redirect_uri_mismatch**: Redirect URI not matching exactly
- **unauthorized_client**: OAuth app not properly configured in Google/Apple