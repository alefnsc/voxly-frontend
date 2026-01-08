/**
 * Onboarding Module
 * 
 * Centralized onboarding logic for consistent routing and step management.
 * 
 * @module lib/onboarding
 */

// Route constants
export {
  ONBOARDING_ROUTES,
  type OnboardingRoute,
  isOnboardingRoute,
  isAuthRoute,
  parseReturnTo,
  buildReturnToState,
  buildSignInUrl,
} from './routes';

// Step metadata
export {
  ONBOARDING_STEPS,
  type OnboardingStep,
  type OnboardingUser,
  type ConsentStatus,
  getRequiredSteps,
  getVisibleSteps,
  getStepProgress,
  getStepByKey,
  getStepByRoute,
} from './steps';

// Routing logic
export {
  type OnboardingRoutingInput,
  type OnboardingRoutingResult,
  getNextOnboardingRoute,
  isOnboardingComplete,
  getNextStepAfter,
} from './getNextRoute';
