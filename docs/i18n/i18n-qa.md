# i18n QA Checklist & Validation Guide

> **Generated:** December 30, 2025  
> **Last Updated:** December 30, 2025 (Session 6)
> **Purpose:** Quality assurance checklist for internationalization testing and validation.

---

## Table of Contents

1. [Language Detection & Resolution](#language-detection--resolution)
2. [First-Time Visitor Scenarios](#first-time-visitor-scenarios)
3. [Language Switching](#language-switching)
4. [Sign-In/Out Persistence](#sign-inout-persistence)
5. [Geo Override Behavior](#geo-override-behavior)
6. [Page-by-Page Spot Checks](#page-by-page-spot-checks)
7. [Technical Validation](#technical-validation)
8. [Automated Testing](#automated-testing)

---

## Language Detection & Resolution

### Current Precedence Order

The language is resolved in the following order:

1. **Explicit user preference** (stored in `localStorage` as `Vocaid_language`)
2. **Browser language** (`navigator.language` / `navigator.languages`)
3. **Geo/IP inference** (via `detectGeolocation()` → country → language mapping)
4. **Default fallback** (`en-US`)

### Test Cases

| # | Scenario | Expected Result | Pass? |
|---|----------|-----------------|-------|
| 1 | User has `Vocaid_language` in localStorage | Uses stored language | ☐ |
| 2 | User has no preference, browser is `pt-BR` | Uses `pt-BR` | ☐ |
| 3 | User has no preference, browser is `de-DE` (unsupported) | Falls back to `en-US` | ☐ |
| 4 | User has no preference, browser is `es` (generic) | Maps to `es-ES` | ☐ |
| 5 | User is in Brazil (geo), no other preference | Uses `pt-BR` | ☐ |
| 6 | Geo fails, browser fails, no localStorage | Falls back to `en-US` | ☐ |

---

## First-Time Visitor Scenarios

### Test Matrix

| Visitor Location | Browser Language | Expected UI Language | Test Method |
|------------------|------------------|---------------------|-------------|
| Brazil | pt-BR | pt-BR | VPN + browser config |
| USA | en-US | en-US | VPN + browser config |
| Mexico | es-MX | es-ES | VPN + browser config |
| France | fr-FR | fr-FR | VPN + browser config |
| Russia | ru-RU | ru-RU | VPN + browser config |
| China | zh-CN | zh-CN | VPN + browser config |
| India | hi-IN | hi-IN | VPN + browser config |
| Germany | de-DE | en-US (unsupported) | VPN + browser config |
| Japan | ja-JP | en-US (unsupported) | VPN + browser config |

### Verification Steps

1. Clear all site data (localStorage, sessionStorage, cookies)
2. Set browser language preference
3. Use VPN or geo override (if testing geo)
4. Navigate to landing page
5. Verify UI is in expected language
6. **No flash of default language** (test with throttled network)

---

## Language Switching

### Test Cases

| # | Action | Expected Result | Pass? |
|---|--------|-----------------|-------|
| 1 | Click language selector | Shows all 7 supported languages | ☐ |
| 2 | Select different language | UI updates immediately | ☐ |
| 3 | Reload page after language change | Same language persists | ☐ |
| 4 | Navigate to different page | Language is maintained | ☐ |
| 5 | Open new tab | Same language is used | ☐ |
| 6 | Switch language mid-interview | Interview language stays, UI changes | ☐ |

### Language Selector Locations

- [ ] Landing page header
- [ ] App top bar (authenticated)
- [ ] Account settings
- [ ] Interview setup (interview language only)

---

## Sign-In/Out Persistence

### Test Cases

| # | Scenario | Expected Result | Pass? |
|---|----------|-----------------|-------|
| 1 | Set language to `pt-BR`, sign out | Language persists (localStorage) | ☐ |
| 2 | Sign in with different browser language | Uses stored preference, not browser | ☐ |
| 3 | Clear localStorage, sign in | Detects from browser/geo | ☐ |
| 4 | User has account language preference | Syncs from server on sign-in | ☐ |
| 5 | Change language while signed in | Updates both localStorage and UI | ☐ |

### Notes

- Currently, language preference is stored client-side only (`localStorage`)
- **TODO:** Sync language preference to user profile in database
- **TODO:** On sign-in, merge server preference with client preference

---

## Geo Override Behavior

### Test Cases

| # | Scenario | Expected Result | Pass? |
|---|----------|-----------------|-------|
| 1 | VPN to Brazil, no localStorage | Uses `pt-BR` | ☐ |
| 2 | VPN to Brazil, localStorage has `en-US` | Uses `en-US` (user preference wins) | ☐ |
| 3 | Geo detection fails | Falls back to browser language | ☐ |
| 4 | Geo returns unknown country | Falls back to `en-US` | ☐ |
| 5 | Localhost (no geo available) | Uses browser language or fallback | ☐ |

### Geo Detection Flow

```
1. Check sessionStorage cache (vocaid_geo_cache)
2. Check Vercel Edge headers (window.__GEO_DATA__)
3. Fetch from ipapi.co API
4. Timezone-based inference (fallback)
5. Default to US
```

---

## Page-by-Page Spot Checks

### Critical Pages

| Page | Language | Check Items | Pass? |
|------|----------|-------------|-------|
| **Landing** | pt-BR | Hero text, CTA buttons, FAQ, footer | ☐ |
| **Landing** | es-ES | Hero text, CTA buttons, FAQ, footer | ☐ |
| **Sign In** | pt-BR | Form labels, button, error messages | ☐ |
| **Sign Up** | pt-BR | Form labels, validation, OAuth buttons | ☐ |
| **Dashboard** | pt-BR | Welcome text, stats, filters | ☐ |
| **Interview Setup** | pt-BR | Form labels, seniority dropdown | ☐ |
| **Interview** | pt-BR | Status messages, quit modal | ☐ |
| **Feedback** | pt-BR | Score labels, feedback sections | ☐ |
| **Billing** | pt-BR | Package names, prices, buttons | ☐ |
| **Account** | pt-BR | Profile labels, security section | ☐ |

### Common Issues to Check

- [ ] Placeholders translated
- [ ] Error messages translated
- [ ] Button labels translated
- [ ] Modal titles and content translated
- [ ] Dropdown options translated
- [ ] Tooltips translated
- [ ] Date/time formatting locale-aware
- [ ] Number formatting locale-aware
- [ ] Currency display correct for region

---

## Technical Validation

### Translation Key Coverage

Run these checks to identify missing translations:

```bash
# Find hardcoded strings in JSX (potential missing i18n)
grep -r "\"[A-Z][a-z]" --include="*.tsx" src/pages src/components | grep -v "className" | grep -v "import"

# Find t() calls with fallback (indicates potentially missing keys)
grep -r "t('.*'," --include="*.tsx" src/

# Count translation keys per locale file
for file in src/lib/locales/*.json; do
  echo "$file: $(jq 'path(..) | length' $file | wc -l) keys"
done
```

### Key Consistency Check

All locale files should have the same keys:

```bash
# Compare keys between en-US and pt-BR
diff <(jq -r 'path(..) | join(".")' src/lib/locales/en-US.json | sort) \
     <(jq -r 'path(..) | join(".")' src/lib/locales/pt-BR.json | sort)
```

### Interpolation Check

Ensure all interpolations are provided:

```bash
# Find {{var}} patterns in locale files
grep -o "{{[^}]*}}" src/lib/locales/en-US.json | sort | uniq

# Verify these are passed in code
for var in count email seconds attempt max; do
  echo "=== $var ==="
  grep -r "$var" --include="*.tsx" src/ | grep "t(" | head -5
done
```

---

## Automated Testing

### Unit Tests for Locale Resolution

```typescript
// src/__tests__/i18n/localeResolution.test.ts

describe('Locale Resolution', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('uses localStorage preference first', () => {
    localStorage.setItem('Vocaid_language', 'pt-BR');
    // Initialize i18n
    expect(i18n.language).toBe('pt-BR');
  });

  it('falls back to navigator.language', () => {
    Object.defineProperty(navigator, 'language', { value: 'es-ES', configurable: true });
    // Initialize i18n
    expect(i18n.language).toBe('es-ES');
  });

  it('maps partial locale codes', () => {
    Object.defineProperty(navigator, 'language', { value: 'es', configurable: true });
    // Initialize i18n
    expect(i18n.language).toBe('es-ES');
  });

  it('falls back to en-US for unsupported languages', () => {
    Object.defineProperty(navigator, 'language', { value: 'de-DE', configurable: true });
    // Initialize i18n
    expect(i18n.language).toBe('en-US');
  });
});
```

### Cypress E2E Tests

```typescript
// cypress/e2e/i18n/language-switching.cy.ts

describe('Language Switching', () => {
  it('switches language via selector', () => {
    cy.visit('/');
    cy.get('[data-testid="language-selector"]').click();
    cy.get('[data-testid="language-option-pt-BR"]').click();
    cy.get('h1').should('contain', 'Carreira'); // Portuguese word
  });

  it('persists language across page navigation', () => {
    cy.visit('/');
    cy.get('[data-testid="language-selector"]').click();
    cy.get('[data-testid="language-option-pt-BR"]').click();
    cy.visit('/about');
    cy.get('h1').should('contain', 'Sobre'); // Portuguese "About"
  });

  it('persists language after reload', () => {
    cy.visit('/');
    cy.get('[data-testid="language-selector"]').click();
    cy.get('[data-testid="language-option-pt-BR"]').click();
    cy.reload();
    cy.get('h1').should('contain', 'Carreira');
  });
});
```

---

## Known Gaps & Action Items

### ✅ Completed (Session 6)

1. [x] Full ContactAssistant.tsx refactor - replaced ~25 inline translations
2. [x] Added contactAssistant.header.*, quickActions.*, prompts.faqFollowUp, placeholder.*, buttons.* to all 7 locales
3. [x] Restructured contactAssistant namespace (review.*, submission.*)
4. [x] Fixed Loading component translation key
5. [x] Fixed AnalyticsFilters translations

### ✅ Completed (Earlier Sessions)

6. [x] Added useTranslation to credits-modal, error-boundary, loading, AppFooter, ContextSwitcher
7. [x] Fixed credit-packages translation keys
8. [x] Enhanced i18n.ts with geo-based language detection
9. [x] Added seniority namespace to all locales
10. [x] Added days namespace for date translations
11. [x] Added analyticsFilters namespace

### Immediate

1. [ ] Add `data-testid` to language selector for testing

### Short-term

2. [ ] Add unit tests for locale resolution logic
3. [ ] Add Cypress tests for language switching
4. [ ] Implement linting rule for hardcoded strings

### Long-term

5. [ ] Sync language preference to user profile in database
6. [ ] Consider SSR language detection to prevent flash
7. [ ] Add locale-specific SEO meta tags
8. [ ] Support RTL languages (Arabic, Hebrew) if needed
9. [ ] Move FAQ content from ContactAssistant data file to locale files

---

## Regression Checklist

Before each release, verify:

- [ ] All 7 languages load without errors
- [ ] Language selector works on all pages
- [ ] No flash of default language on first load
- [ ] Interview language is independent of UI language
- [ ] Payment flows work in all languages
- [ ] Error messages are translated
- [ ] Date/time displays correctly per locale
- [ ] No missing translation keys in console

---

## Contact

For i18n issues or questions:
- Check `#frontend` Slack channel
- File issue with label `i18n`
- Review this document and `page-component-map.md`
