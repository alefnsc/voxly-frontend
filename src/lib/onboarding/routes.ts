/**
 * Onboarding Route Constants
 * 
 * Single source of truth for all onboarding-related routes.
 * Used by guards, pages, and navigation helpers.
 * 
 * @module lib/onboarding/routes
 */

export const ONBOARDING_ROUTES = {
  // Onboarding flow pages
  ACCOUNT_TYPE: '/onboarding/account-type',
  PASSWORD: '/onboarding/password',
  CONSENT: '/onboarding/consent',
  
  // Auth pages
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
  POST_LOGIN: '/auth/post-login',
  AUTH_ERROR: '/auth/error',
  
  // Default destination after onboarding
  DEFAULT_AUTHENTICATED: '/app/b2c/dashboard',
  HOME: '/',
} as const;

export type OnboardingRoute = typeof ONBOARDING_ROUTES[keyof typeof ONBOARDING_ROUTES];

/**
 * Check if a route is an onboarding page
 */
export function isOnboardingRoute(path: string): boolean {
  return path.startsWith('/onboarding/');
}

/**
 * Check if a route is an auth page (sign-in, sign-up, etc.)
 */
export function isAuthRoute(path: string): boolean {
  return (
    path === ONBOARDING_ROUTES.SIGN_IN ||
    path === ONBOARDING_ROUTES.SIGN_UP ||
    path.startsWith('/auth/')
  );
}

/**
 * Parse returnTo from location state or query params
 * Validates that returnTo is a safe internal route
 */
export function parseReturnTo(
  locationState: unknown,
  searchParams?: URLSearchParams
): string {
  // Try location state first
  const stateReturnTo = (locationState as any)?.returnTo;
  if (stateReturnTo && typeof stateReturnTo === 'string') {
    if (isValidReturnTo(stateReturnTo)) {
      return stateReturnTo;
    }
  }
  
  // Try query params
  const queryReturnTo = searchParams?.get('returnTo');
  if (queryReturnTo && isValidReturnTo(queryReturnTo)) {
    return queryReturnTo;
  }
  
  // Default
  return ONBOARDING_ROUTES.DEFAULT_AUTHENTICATED;
}

/**
 * Validate that a returnTo path is safe (internal route only)
 */
function isValidReturnTo(path: string): boolean {
  // Must start with /
  if (!path.startsWith('/')) return false;
  
  // Must not be an auth or onboarding route (would cause loops)
  if (isAuthRoute(path) || isOnboardingRoute(path)) return false;
  
  // Must not contain protocol (prevent open redirect)
  if (path.includes('://')) return false;
  
  return true;
}

/**
 * Build returnTo state object for navigation
 */
export function buildReturnToState(returnTo: string): { returnTo: string } {
  return { returnTo };
}

/**
 * Build sign-in URL with returnTo query param
 */
export function buildSignInUrl(returnTo?: string): string {
  if (!returnTo || !isValidReturnTo(returnTo)) {
    return ONBOARDING_ROUTES.SIGN_IN;
  }
  return `${ONBOARDING_ROUTES.SIGN_IN}?returnTo=${encodeURIComponent(returnTo)}`;
}
