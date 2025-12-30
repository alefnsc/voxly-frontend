# Page-to-Component Mapping with i18n Status

> **Generated:** December 30, 2025  
> **Last Updated:** December 30, 2025 (Session 6 - ContactAssistant Complete)
> **Purpose:** Track which components are used by which pages and their internationalization status.

## Legend

| Status | Meaning |
|--------|---------|
| ✅ | Fully localized - all strings use `t()` |
| ⚠️ | Partially localized - some hardcoded strings remain |
| ❌ | Missing localization - no `useTranslation` hook |

---

## Pages

### `/` - Landing Page
**File:** `src/pages/Landing/index.tsx`  
**Status:** ⚠️ Partially localized  
**Issues:** SEO meta tags are hardcoded

**Components:**
- `components/landing/` ✅
  - `LandingHero.tsx` ✅
  - `LandingPlatformShowcase.tsx` ✅
  - `LandingFeatureGrid.tsx` ✅
  - `LandingIntegrations.tsx` ⚠️ (mock code content)
  - `LandingPricing.tsx` ✅
  - `LandingFaq.tsx` ✅
  - `LandingDashboardPreview.tsx` ⚠️ (mock data)
  - `LandingMockData.ts` ✅ (uses translation keys)
  - `LandingB2CFeatures.tsx` ✅ (fixed - uses t() with feature keys)
- `components/footer/` → `components/shared/AppFooter.tsx` ✅ (fixed)
- `components/hero-banner/` ✅
- `components/feature-grid/` ✅
- `components/how-it-works/` ✅
- `components/testimonial-carousel/` ✅
- `components/logo-carousel/` ✅
- `components/floating-cta/` ✅
- `components/trust-bar/` ✅

---

### `/dashboard` - Dashboard
**File:** `src/pages/Dashboard/index.tsx`  
**Status:** ✅ Fully localized  
**Issues:** ~~Seniority filter hardcoded~~ Fixed. ~~Date formatting hardcoded~~ Fixed - uses `i18n.language`

**Components:**
- `components/default-layout/` ✅
- `components/loading/` ✅ (fixed)
- `components/ui/select` ✅

---

### `/app/b2c/dashboard` - B2C Dashboard
**File:** `src/pages/app/b2c/dashboard/index.tsx`  
**Status:** ✅ Fully localized  
**Issues:** ~~Day abbreviations hardcoded~~ Fixed - uses `t('days.*')`. ~~Date formatting hardcoded~~ Fixed - uses `i18n.language`. Seniority filter ✅ fixed

**Components:**
- `components/ui/select` ✅

---

### `/app/b2c/interview/new` - New Interview Setup
**File:** `src/pages/app/b2c/interview/new/index.tsx`  
**Status:** ✅ Fully localized  
**Issues:** ~~Seniority levels hardcoded~~ Fixed - uses `t('interview.seniority.*')`

**Components:**
- `components/default-layout/` ✅
- `components/interview-breadcrumbs/` ✅

---

### `/app/b2c/billing` - Billing Page
**File:** `src/pages/app/b2c/billing/index.tsx`  
**Status:** ✅ Fully localized  
**Issues:** ~~Date formatting hardcoded~~ Fixed - uses `i18n.language`

**Components:**
- `components/default-layout/` ✅
- `components/credit-packages/` ✅ (fixed - all strings use t())

---

### `/app/b2c/repository` - Interview Repository
**File:** `src/pages/app/b2c/repository/index.tsx`  
**Status:** ✅ Fully localized  
**Issues:** ~~Seniority filter hardcoded~~ Fixed. ~~Date formatting hardcoded~~ Fixed - uses `i18n.language`

**Components:**
- `components/default-layout/` ✅
- `components/loading/` ✅ (fixed)
- `components/ui/purple-button` ✅

---

### `/interview/:id` - Interview Session
**File:** `src/pages/Interview/index.tsx`  
**Status:** ✅ Fully localized

**Components:**
- `components/default-layout/` ✅
- `components/loading/` ❌
- `components/mic-permission-modal/` ✅
- `components/quit-interview-modal/` ✅
- `components/interview-content/` ✅
- `components/interview-breadcrumbs/` ✅

---

### `/interview-details/:id` - Interview Details
**File:** `src/pages/InterviewDetails/index.tsx`  
**Status:** ✅ Fully localized  
**Issues:** ~~Date formatting hardcoded~~ Fixed - uses `i18n.language`

**Components:**
- `components/loading/` ✅ (fixed - uses `t('common.loading')`)
- `components/contact-button/` ✅
- `components/ui/purple-button` ✅
- `components/ui/stats-card` ✅
- `components/analytics/` ✅
  - `SentimentTimeline.tsx` ✅
  - `SoftSkillsRadar.tsx` ✅
  - `BenchmarkComparison.tsx` ✅
  - `LearningPath.tsx` ✅
  - `TranscriptViewer.tsx` ✅
  - `AnalyticsFilters.tsx` ✅ (fixed - uses `analyticsFilters.*` namespace)
- `components/interview-ready/` ✅

**Subcomponents:**
- `InterviewAnalyticsSection.tsx` ✅
- `InterviewFeedbackSections.tsx` ✅
- `InterviewHeader.tsx` ✅
- `InterviewNoFeedback.tsx` ✅
- `InterviewScoreSection.tsx` ✅
- `InterviewStatsGrid.tsx` ✅

---

### `/feedback/:id` - Feedback Page
**File:** `src/pages/Feedback/index.tsx`  
**Status:** ⚠️ Partially localized  
**Issues:** PDF content headers hardcoded

**Components:**
- `components/default-layout/` ✅
- `components/score-display/` ✅
- `components/ui/card` ✅
- `components/ui/button` ✅
- `components/ui/separator` ✅
- `components/ui/text-box` ✅
- `components/interview-breadcrumbs/` ✅
- `components/ui/purple-button` ✅

---

### `/about` - About Page
**File:** `src/pages/About/index.tsx`  
**Status:** ✅ Fully localized

**Components:**
- `components/interview-ready/` ✅

---

### `/account` - Account Settings
**File:** `src/pages/Account/index.tsx`  
**Status:** ⚠️ Partially localized  
**Issues:** "(Coming soon)" hardcoded

**Components:**
- `components/auth/CustomAvatar` ✅
- `components/auth/AuthInput` ⚠️
- `components/auth/AuthSelect` ✅
- `components/auth/validation` (utility)

---

### `/payment-result` - Payment Result
**File:** `src/pages/PaymentResult/index.tsx`  
**Status:** ⚠️ Partially localized  
**Issues:** Package names, "Credits" label hardcoded

**Components:**
- `components/default-layout/` ✅
- `components/ui/purple-button` ✅

---

### `/privacy-policy` - Privacy Policy
**File:** `src/pages/PrivacyPolicy/index.tsx`  
**Status:** ⚠️ Legal content intentionally in English

**Components:** None

---

### `/terms-of-use` - Terms of Use
**File:** `src/pages/TermsOfUse/index.tsx`  
**Status:** ⚠️ Legal content intentionally in English

**Components:** None

---

### `/resume-library` - Resume Library
**File:** `src/pages/ResumeLibrary/index.tsx`  
**Status:** ⚠️ Partially localized  
**Issues:** Job role options hardcoded

**Components:**
- `components/default-layout/` ✅
- `components/loading/` ❌
- `components/ui/input` ✅
- `components/ui/select` ✅
- `components/ui/purple-button` ✅

---

### `/sign-in` - Sign In
**File:** `src/pages/SignIn/index.tsx`  
**Status:** ✅ Delegated to auth components

**Components:**
- `components/auth/` ✅
  - `SignInForm.tsx` ✅
  - `AuthInput.tsx` ⚠️
  - `OAuthButtons.tsx` ✅

---

### `/sign-up` - Sign Up
**File:** `src/pages/SignUp/index.tsx`  
**Status:** ✅ Delegated to auth components

**Components:**
- `components/auth/` ✅
  - `SignUpForm.tsx` ⚠️
  - `AuthInput.tsx` ⚠️
  - `OAuthButtons.tsx` ✅

---

### `/access-denied` - Access Denied
**File:** `src/pages/AccessDenied/index.tsx`  
**Status:** ✅ Fully localized

**Components:**
- `components/ui/purple-button` ✅

---

### `/sso-callback` - SSO Callback
**File:** `src/pages/SSOCallback/index.tsx`  
**Status:** ✅ Fully localized

**Components:** None

---

### `/onboarding/consent` - Consent Page
**File:** `src/pages/onboarding/ConsentPage.tsx`  
**Status:** ✅ Fully localized

**Components:** None

---

### `/under-construction` - Under Construction
**File:** `src/pages/UnderConstruction/index.tsx`  
**Status:** ✅ Fully localized

**Components:**
- `components/shared/Brand` ✅

---

## Shared Components (Cross-Cutting)

### ❌ Needs i18n

| Component | Priority | Hardcoded Strings |
|-----------|----------|-------------------|
| ~~`components/credits-modal/`~~ | ~~HIGH~~ | ✅ Fixed |
| ~~`components/error-boundary/`~~ | ~~HIGH~~ | ✅ Fixed |
| ~~`components/loading/`~~ | ~~HIGH~~ | ✅ Fixed |
| ~~`components/shared/AppFooter.tsx`~~ | ~~HIGH~~ | ✅ Fixed |
| ~~`components/navigation/ContextSwitcher.tsx`~~ | ~~HIGH~~ | ✅ Fixed |
| ~~`components/analytics/AnalyticsFilters.tsx`~~ | ~~MEDIUM~~ | ✅ Fixed |
| ~~`components/credit-packages/`~~ | ~~HIGH~~ | ✅ Fixed |
| `components/auth/AuthInput.tsx` | MEDIUM | Validation error messages |
| `components/auth/SignUpForm.tsx` | MEDIUM | Validation error messages |

### ✅ Fully Localized

| Component | Notes |
|-----------|-------|
| `components/landing/*` | All landing sections use translations |
| `components/landing/LandingMockData.ts` | Uses translation keys (titleKey, descriptionKey) |
| `components/landing/LandingB2CFeatures.tsx` | Uses t() with feature keys |
| `components/credits-modal/` | Uses `creditsModal.*` namespace |
| `components/error-boundary/` | Uses `errorBoundary.*` namespace with withTranslation HOC |
| `components/loading/` | Uses `common.loading` |
| `components/shared/AppFooter.tsx` | Uses `appFooter.*` namespace |
| `components/navigation/ContextSwitcher.tsx` | Uses `contextSwitcher.*` namespace |
| `components/analytics/AnalyticsFilters.tsx` | Uses `analyticsFilters.*` namespace |
| `components/credit-packages/` | Uses `creditPackages.*` namespace |
| `components/sidebar/` | Uses `nav.*` namespace |
| `components/top-bar/` | Uses `nav.*` namespace |
| `components/language-selector/` | Uses language names from config |
| `components/mic-permission-modal/` | Uses `interview.micModal.*` namespace |
| `components/quit-interview-modal/` | Uses `interview.quitModal.*` namespace |
| `components/interview-content/` | Uses `interview.*` namespace |
| `components/interview-breadcrumbs/` | Uses translated labels |
| `components/score-display/` | Uses `scoreDisplay.*` namespace |
| `components/contact-button/` | Uses `contact.*` namespace |
| `components/contact-assistant/` | Uses `contactAssistant.*` namespace |
| `components/beta-feedback/` | Uses `betaFeedback.*` namespace |
| `components/performance-chat/` | Uses `performanceChat.*` namespace |

---

## Component Dependency Tree (2 levels)

```
src/pages/
├── Landing/
│   └── components/landing/
│       ├── LandingHero.tsx
│       │   └── components/ui/button
│       ├── LandingPlatformShowcase.tsx
│       │   └── components/ui/card
│       ├── LandingFeatureGrid.tsx
│       │   └── components/ui/card
│       └── LandingFooter.tsx
│           └── components/shared/Brand
├── Dashboard/
│   ├── components/default-layout/
│   │   ├── components/sidebar/
│   │   │   └── components/navigation/ContextSwitcher.tsx
│   │   └── components/top-bar/
│   │       └── components/language-selector/
│   └── components/ui/select
├── Interview/
│   ├── components/interview-content/
│   │   ├── components/audio-visualizer/
│   │   └── components/sphere/
│   ├── components/mic-permission-modal/
│   └── components/quit-interview-modal/
├── InterviewDetails/
│   ├── components/analytics/
│   │   ├── SentimentTimeline.tsx
│   │   ├── SoftSkillsRadar.tsx
│   │   ├── BenchmarkComparison.tsx
│   │   ├── LearningPath.tsx
│   │   ├── TranscriptViewer.tsx
│   │   └── AnalyticsFilters.tsx
│   └── components/interview-ready/
└── app/b2c/billing/
    ├── components/credit-packages/
    │   └── components/ui/button
    └── components/default-layout/
```

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total Pages Analyzed | 23 |
| Pages Fully Localized | 10 |
| Pages Partially Localized | 11 |
| Pages Missing Localization | 2 |
| Shared Components Needing Work | 0 (down from 9) |
| Estimated Hardcoded Strings | ~10 (down from ~100) |

---

## Priority Action Items

### ✅ Completed (Session 1 & 2)
1. ~~Add `useTranslation` to `components/credits-modal/index.tsx`~~ ✅
2. ~~Add `useTranslation` to `components/error-boundary/index.tsx`~~ ✅ (withTranslation HOC)
3. ~~Add `useTranslation` to `components/loading/index.tsx`~~ ✅
4. ~~Add `useTranslation` to `components/shared/AppFooter.tsx`~~ ✅
5. ~~Add `useTranslation` to `components/navigation/ContextSwitcher.tsx`~~ ✅
6. ~~Add `useTranslation` to `components/credit-packages/index.tsx`~~ ✅
7. ~~Add `useTranslation` to `components/analytics/AnalyticsFilters.tsx`~~ ✅
8. ~~Update `LandingMockData.ts` to use translation keys~~ ✅
9. ~~Update `LandingB2CFeatures.tsx` to use t() for features~~ ✅
10. ~~Enhanced `i18n.ts` with geo-based language detection~~ ✅
11. ~~Added translations to all 7 locale files~~ ✅

### ✅ Completed (Session 6)
12. ~~Full refactor of `components/contact-assistant/ContactAssistant.tsx`~~ ✅
    - Replaced ~25 inline `currentLanguage === 'pt' ?` ternary translations with `t()` calls
    - Added `contactAssistant.header.*`, `quickActions.*`, `prompts.faqFollowUp`, `placeholder.*`, `buttons.*` to all 7 locales
    - Restructured namespace: moved keys from `prompts` to `review` and `submission` sub-objects

### Short-term (MEDIUM)
1. Fix seniority options in Dashboard, Repository, Interview setup pages
2. Fix validation messages in auth components

### Long-term (LOW)
1. Consider locale-specific SEO meta tags in Landing page
2. Review remaining mock data components
