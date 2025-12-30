# Authentication Flow Configuration

This document describes how to configure OAuth authentication for Vocaid using Clerk.

## Overview

Vocaid uses Clerk for authentication with the following OAuth providers:
- Google OAuth
- Apple OAuth (Sign in with Apple)

## Clerk Dashboard Configuration

### 1. Google OAuth Setup

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/) → Your Application → **User & Authentication** → **SSO Connections**

2. Enable **Google** as an OAuth provider

3. Configure redirect URLs in Clerk:
   - **Redirect URL (Callback)**: `https://your-domain.com/sso-callback`
   - **After Sign-in URL**: `https://your-domain.com/app/b2c/dashboard`
   - **After Sign-up URL**: `https://your-domain.com/app/b2c/dashboard`

4. In your Google Cloud Console:
   - Add authorized redirect URI: `https://clerk.your-domain.com/v1/oauth_callback`
   - Add JavaScript origin: `https://your-domain.com`

### 2. Apple OAuth Setup (Sign in with Apple)

Apple OAuth requires additional configuration:

#### Step 1: Apple Developer Account Setup

1. Sign in to [Apple Developer Portal](https://developer.apple.com/)

2. Go to **Certificates, Identifiers & Profiles** → **Identifiers**

3. Create a new **App ID**:
   - Description: "Vocaid App"
   - Bundle ID: `com.vocaid.app` (explicit)
   - Enable **Sign in with Apple** capability

4. Create a new **Services ID**:
   - Description: "Vocaid Web Auth"
   - Identifier: `com.vocaid.web`
   - Enable **Sign in with Apple**
   - Configure domain and redirect:
     - **Domain**: `clerk.your-domain.com` (Clerk's domain, not your app domain)
     - **Return URL**: `https://clerk.your-domain.com/v1/oauth_callback`

5. Create a **Key** for Sign in with Apple:
   - Name: "Vocaid Sign In Key"
   - Enable **Sign in with Apple**
   - Download the `.p8` key file and note the Key ID

#### Step 2: Clerk Dashboard Configuration

1. Go to Clerk Dashboard → **SSO Connections** → **Apple**

2. Enter the following:
   - **Bundle ID / Services ID**: `com.vocaid.web`
   - **Team ID**: Found in Apple Developer portal (top right of membership page)
   - **Key ID**: From the key you created
   - **Private Key**: Contents of the `.p8` file

3. Save and enable the connection

#### Step 3: Verify Callback URLs

Ensure these URLs are configured in Clerk:
- **Redirect URL**: `/sso-callback`
- **After Sign-in/Sign-up URL**: `/app/b2c/dashboard`

## Frontend Code

### AuthButtons Component

The `AuthButtons` component handles OAuth flows:

\`\`\`tsx
await auth.authenticateWithRedirect({
  strategy: 'oauth_google', // or 'oauth_apple'
  redirectUrl: '/sso-callback',
  redirectUrlComplete: '/app/b2c/dashboard',
});
\`\`\`

### SSO Callback Page

Located at `/src/pages/SSOCallback/index.tsx`:

\`\`\`tsx
<AuthenticateWithRedirectCallback />
\`\`\`

### Handshake Fallback

If Clerk redirects directly to `/dashboard` with a `__clerk_handshake` parameter (which can happen with certain configurations), the `HandshakeFallback` component will catch and process it:

\`\`\`tsx
<Route 
  path="dashboard" 
  element={
    <HandshakeFallback redirectTo="/app/b2c/dashboard">
      <Navigate to="/app/b2c/dashboard" replace />
    </HandshakeFallback>
  } 
/>
\`\`\`

## Troubleshooting

### Google OAuth Redirecting with Handshake Token

**Symptom**: User clicks "Continue with Google", authenticates, then lands on `/dashboard?__clerk_handshake=...` instead of completing auth properly.

**Cause**: Clerk's redirect URL configuration doesn't match the `redirectUrl` in code.

**Solutions**:
1. Verify Clerk Dashboard redirect URLs match your code
2. The `HandshakeFallback` component provides a fallback to process these tokens
3. Check that your production Clerk instance has the correct domain configured

### Apple OAuth Not Working

**Symptom**: "Invalid redirect URI" or similar error during Apple sign-in.

**Cause**: Apple is very strict about redirect URIs.

**Solutions**:
1. The Return URL in Apple must exactly match Clerk's OAuth callback URL
2. Use Clerk's domain for the return URL, not your app domain
3. Ensure the Services ID is used (not the App ID)
4. Verify Team ID and Key ID are correct

### OAuth Popup Blocked

**Symptom**: OAuth popup is blocked by browser.

**Solution**: Ensure OAuth is triggered by direct user interaction (button click), not by JavaScript timers or automatic redirects.

## Environment Variables

Required in `.env`:

\`\`\`
# Frontend
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_live_xxx

# Backend
CLERK_SECRET_KEY=sk_live_xxx
\`\`\`

## Testing Checklist

- [ ] Google OAuth works on localhost
- [ ] Google OAuth works on production domain
- [ ] Apple OAuth works on production domain (Apple doesn't work on localhost)
- [ ] Sign-up flow creates user and redirects to dashboard
- [ ] Sign-in flow authenticates and redirects to dashboard
- [ ] Handshake fallback catches direct dashboard redirects
- [ ] SSO callback page shows loading state
