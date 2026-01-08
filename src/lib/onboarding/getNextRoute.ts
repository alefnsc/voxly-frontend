/**
 * Get Next Onboarding Route
 * 
 * Single source of truth for determining the next route in onboarding.
 * Used by guards, PostLogin, and onboarding pages.
 * 
 * @module lib/onboarding/getNextRoute
 */

import { ONBOARDING_ROUTES } from './routes';
import { ONBOARDING_STEPS, OnboardingUser, ConsentStatus } from './steps';

/**
 * Debug mode for routing decisions (enabled in development only)
 */
const DEBUG_ROUTING = process.env.NODE_ENV !== 'production';

function debugLog(message: string, data?: Record<string, unknown>): void {
  if (DEBUG_ROUTING) {
    console.log(`🔀 [Onboarding Router] ${message}`, data ? data : '');
  }
}

/**
 * Input for routing decision
 */
export interface OnboardingRoutingInput {
  /** User data from AuthContext or UserContext */
  user: OnboardingUser | null;
  /** Whether auth is loaded */
  isAuthLoaded: boolean;
  /** Whether user is signed in */
  isSignedIn: boolean;
  /** Consent status from backend (may be null if not fetched) */
  consentStatus: ConsentStatus | null;
  /** Whether consent status is loading */
  isConsentLoading?: boolean;
  /** Current path (for context in logs) */
  currentPath?: string;
}

/**
 * Output of routing decision
 */
export interface OnboardingRoutingResult {
  /** Next route to navigate to, or null if onboarding complete */
  nextRoute: string | null;
  /** Reason for the decision (for debugging) */
  reason: string;
  /** Whether user should be allowed to proceed (for guards) */
  allowAccess: boolean;
  /** Whether to show loading state */
  showLoading: boolean;
}

/**
 * Determine the next onboarding route for a user
 * 
 * This is the SINGLE SOURCE OF TRUTH for all onboarding routing decisions.
 * All guards and pages should use this function.
 */
export function getNextOnboardingRoute(
  input: OnboardingRoutingInput
): OnboardingRoutingResult {
  const { user, isAuthLoaded, isSignedIn, consentStatus, isConsentLoading, currentPath } = input;
  
  // Auth not loaded yet - show loading
  if (!isAuthLoaded) {
    debugLog('Auth not loaded, showing loading state', { currentPath });
    return {
      nextRoute: null,
      reason: 'Auth not loaded',
      allowAccess: false,
      showLoading: true,
    };
  }
  
  // Not signed in - redirect to sign-in
  if (!isSignedIn || !user) {
    debugLog('User not signed in, redirect to sign-in', { currentPath });
    return {
      nextRoute: ONBOARDING_ROUTES.SIGN_IN,
      reason: 'Not authenticated',
      allowAccess: false,
      showLoading: false,
    };
  }
  
  // Check each required step in order
  for (const step of ONBOARDING_STEPS) {
    // Skip optional steps (like phone)
    const isRequired = step.required || (step.isRequiredFor?.(user) ?? false);
    if (!isRequired) continue;
    
    // Check if step is complete
    const isComplete = step.isCompleteFor(user, consentStatus ?? undefined);
    
    if (!isComplete) {
      // Special case: consent step requires consent status
      if (step.key === 'consent') {
        if (isConsentLoading) {
          debugLog('Consent status loading', { currentPath, step: step.key });
          return {
            nextRoute: null,
            reason: 'Consent status loading',
            allowAccess: false,
            showLoading: true,
          };
        }
        
        // If consent status is null (not fetched), redirect to consent
        if (consentStatus === null) {
          debugLog('Consent status unknown, redirecting to consent', { currentPath });
          return {
            nextRoute: step.route,
            reason: 'Consent status unknown',
            allowAccess: false,
            showLoading: false,
          };
        }
      }
      
      debugLog('Step incomplete, redirecting', { 
        currentPath, 
        step: step.key, 
        route: step.route,
        user: { 
          accountTypeConfirmedAt: user.accountTypeConfirmedAt,
          hasPassword: user.hasPassword,
        },
        consentStatus,
      });
      
      return {
        nextRoute: step.route,
        reason: `Step '${step.key}' incomplete`,
        allowAccess: false,
        showLoading: false,
      };
    }
  }
  
  // All required steps complete
  debugLog('All onboarding steps complete', { currentPath });
  return {
    nextRoute: null,
    reason: 'Onboarding complete',
    allowAccess: true,
    showLoading: false,
  };
}

/**
 * Check if onboarding is complete for a user
 * Convenience wrapper around getNextOnboardingRoute
 */
export function isOnboardingComplete(
  user: OnboardingUser | null,
  consentStatus: ConsentStatus | null
): boolean {
  if (!user) return false;
  
  const result = getNextOnboardingRoute({
    user,
    isAuthLoaded: true,
    isSignedIn: true,
    consentStatus,
  });
  
  return result.allowAccess && result.nextRoute === null;
}

/**
 * Get the next step after completing a specific step
 * Used by onboarding pages to navigate after form submission
 */
export function getNextStepAfter(
  completedStepKey: 'accountType' | 'password' | 'consent',
  user: OnboardingUser,
  consentStatus: ConsentStatus | null
): string {
  // Find the completed step index
  const currentIndex = ONBOARDING_STEPS.findIndex(s => s.key === completedStepKey);
  
  // Check subsequent steps
  for (let i = currentIndex + 1; i < ONBOARDING_STEPS.length; i++) {
    const step = ONBOARDING_STEPS[i];
    
    // Skip optional steps (like phone - handled within consent page)
    if (step.key === 'phone') continue;
    
    const isRequired = step.required || (step.isRequiredFor?.(user) ?? false);
    if (!isRequired) continue;
    
    const isComplete = step.isCompleteFor(user, consentStatus ?? undefined);
    if (!isComplete) {
      debugLog('Next step after completion', { 
        completedStep: completedStepKey, 
        nextStep: step.key, 
        route: step.route 
      });
      return step.route;
    }
  }
  
  // All steps complete, go to dashboard
  debugLog('All steps complete after', { completedStep: completedStepKey });
  return ONBOARDING_ROUTES.DEFAULT_AUTHENTICATED;
}
