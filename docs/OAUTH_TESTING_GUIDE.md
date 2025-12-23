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

### Environment Variables

**Frontend (.env.local)**
```
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_xxx
REACT_APP_ENV=development
REACT_APP_BACKEND_URL_DEV=http://localhost:3001
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
GET /api/auth/mock/oauth/start?provider=google    - Simulate Google OAuth
GET /api/auth/mock/oauth/start?provider=apple     - Simulate Apple OAuth
GET /api/auth/mock/oauth/start?provider=microsoft - Simulate Microsoft OAuth
```

### Usage Example
```javascript
const response = await fetch('http://localhost:3001/api/auth/mock/oauth/start?provider=google');
const { redirectUrl, provider, mock } = await response.json();
// redirectUrl contains the mock callback URL for testing
```

**Note:** Mock endpoints only work when `NODE_ENV === 'development'`

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

### Issue: User not appearing in database
**Solution:** Check Clerk webhook configuration and logs

---

## 7. Clerk Dashboard Checklist

- [ ] Google OAuth enabled
- [ ] Apple OAuth enabled (requires Apple Developer account)
- [ ] Microsoft OAuth enabled
- [ ] Redirect URLs configured correctly
- [ ] Webhook endpoint configured for user sync

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2024-12-21 | 1.0 | Initial OAuth testing guide |
| 2024-12-22 | 1.1 | Added Microsoft OAuth, removed LinkedIn/PayPal |
