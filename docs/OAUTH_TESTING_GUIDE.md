# OAuth Testing Guide

## Overview

This document provides manual testing steps for all OAuth providers in the Voxly authentication system.

---

## 1. Prerequisites

### Clerk Dashboard Configuration
Ensure the following OAuth providers are enabled in your Clerk Dashboard:
- Google (Social connections → Google)
- Apple (Social connections → Apple)
- Microsoft (Social connections → Microsoft)
- LinkedIn (Social connections → LinkedIn)

### Environment Variables

**Frontend (.env.local)**
```
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_xxx
REACT_APP_ENV=development
REACT_APP_BACKEND_URL_DEV=http://localhost:3001
```

**Backend (.env)**
```
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox
```

---

## 2. OAuth Provider Testing

### 2.1 Google OAuth ✅
**Strategy:** `oauth_google` (Clerk)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/sign-in` | Sign-in page loads with OAuth buttons |
| 2 | Click "Continue with Google" | Redirects to Google consent screen |
| 3 | Select Google account | Redirects back to app |
| 4 | Check Clerk Dashboard | User created with Google provider |
| 5 | Check local DB | User synced via webhook |

### 2.2 Apple OAuth 🍎 (Regression Validation)
**Strategy:** `oauth_apple` (Clerk)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/sign-in` | Sign-in page loads with OAuth buttons |
| 2 | Click "Continue with Apple" | Redirects to Apple Sign In page |
| 3 | Authenticate with Apple ID | Redirects back to app |
| 4 | Verify email handling | Apple may hide real email - check both cases |
| 5 | Check Clerk Dashboard | User created with Apple provider |
| 6 | Test on Safari (macOS) | Verify Touch ID / Face ID prompts work |

**Apple-Specific Considerations:**
- First sign-in shows "Share My Email" or "Hide My Email" option
- Hidden email format: `xxxxx@privaterelay.appleid.com`
- Subsequent sign-ins may skip email selection
- Test on actual Apple device for full flow

### 2.3 Microsoft OAuth 🪟
**Strategy:** `oauth_microsoft` (Clerk)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/sign-in` | Sign-in page loads with OAuth buttons |
| 2 | Click "Continue with Microsoft" | Redirects to Microsoft login |
| 3 | Login with Microsoft account | Redirects back to app |
| 4 | Check Clerk Dashboard | User created with Microsoft provider |
| 5 | Test both personal and work accounts | Both should work |

**Microsoft-Specific Considerations:**
- Personal accounts (outlook.com, hotmail.com)
- Work/School accounts (Azure AD)
- Some organizations may block OAuth consent

### 2.4 LinkedIn OAuth 💼
**Strategy:** `oauth_linkedin_oidc` (Clerk)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/sign-in` | Sign-in page loads with OAuth buttons |
| 2 | Click "Continue with LinkedIn" | Redirects to LinkedIn authorization |
| 3 | Authorize the application | Redirects back to app |
| 4 | Check Clerk Dashboard | User created with LinkedIn provider |

**LinkedIn-Specific Considerations:**
- Uses OIDC protocol (not legacy OAuth)
- Provides profile and email scopes
- LinkedIn may require app verification for production

### 2.5 PayPal OAuth 💳
**Flow:** Custom OAuth (not Clerk)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Sign in with another provider first | User must be authenticated |
| 2 | Navigate to payment settings or click PayPal button | PayPal OAuth initiated |
| 3 | Click "Continue with PayPal" | Redirects to PayPal authorization |
| 4 | Login to PayPal sandbox account | Redirects to `/auth/paypal/callback` |
| 5 | Callback processes | Shows success/error message, redirects to dashboard |
| 6 | Check database | `PaymentProviderConnection` created |

**PayPal-Specific Considerations:**
- Uses sandbox in development (`sandbox.paypal.com`)
- Links PayPal account for payments, not primary auth
- Stores access/refresh tokens in `PaymentProviderConnection`

---

## 3. Environment Routing Validation

### Development Environment
```bash
REACT_APP_ENV=development
# Should use: REACT_APP_BACKEND_URL_DEV
```

**Verification:**
1. Open browser DevTools → Network tab
2. Trigger any API call
3. Confirm requests go to `http://localhost:3001`

### Production Environment
```bash
REACT_APP_ENV=production
# Should use: REACT_APP_BACKEND_URL_PROD
```

**Verification:**
1. Build with `npm run build`
2. Serve build locally or deploy
3. Confirm requests go to production API URL

---

## 4. Dev-Only Mock OAuth Endpoints

For local testing without real OAuth providers, use mock endpoints:

### Available Mock Endpoints
```
POST /auth/mock/google    - Simulate Google OAuth
POST /auth/mock/apple     - Simulate Apple OAuth
POST /auth/mock/microsoft - Simulate Microsoft OAuth
POST /auth/mock/linkedin  - Simulate LinkedIn OAuth
```

### Usage Example
```javascript
const response = await fetch('http://localhost:3001/auth/mock/google', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    name: 'Test User',
  }),
});
const { mockClerkId, mockToken } = await response.json();
```

**Note:** Mock endpoints only work when `NODE_ENV !== 'production'`

---

## 5. Auth Provider Tracking

User model now tracks authentication providers:

```prisma
model User {
  authProviders    String[]  // ["google", "apple", "microsoft"]
  lastAuthProvider String?   // "google"
}
```

### Verification
1. Sign in with different providers
2. Query user record
3. Confirm `authProviders` array contains all used providers
4. Confirm `lastAuthProvider` shows most recent

---

## 6. Common Issues & Solutions

### Issue: OAuth button not responding
**Solution:** Check browser console for Clerk initialization errors

### Issue: Redirect loop after OAuth
**Solution:** Verify Clerk redirect URLs in dashboard match app URLs

### Issue: "Invalid redirect_uri" error
**Solution:** Add exact callback URL to OAuth provider settings

### Issue: PayPal callback fails
**Solution:** 
- Check PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET
- Verify sandbox mode is enabled for development
- Confirm user is already authenticated (Clerk session exists)

### Issue: User not appearing in database
**Solution:** Check Clerk webhook configuration and logs

---

## 7. Clerk Dashboard Checklist

- [ ] Google OAuth enabled
- [ ] Apple OAuth enabled (requires Apple Developer account)
- [ ] Microsoft OAuth enabled
- [ ] LinkedIn OAuth enabled
- [ ] Redirect URLs configured correctly
- [ ] Webhook endpoint configured for user sync

---

## 8. Backend Environment Variables Reference

```env
# PayPal OAuth (for payment linking, not auth)
PAYPAL_CLIENT_ID=xxx
PAYPAL_CLIENT_SECRET=xxx
PAYPAL_MODE=sandbox  # or 'live' for production

# Clerk (for webhook verification)
CLERK_WEBHOOK_SECRET=whsec_xxx
```

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2024-12-21 | 1.0 | Initial OAuth testing guide |
| 2024-12-22 | 1.1 | Added Microsoft, LinkedIn, PayPal OAuth |
