/**
 * Onboarding Step Metadata
 * 
 * Centralized definition of onboarding steps for consistent
 * progress indicators, labels, and step counting across pages.
 * 
 * @module lib/onboarding/steps
 */

import { ONBOARDING_ROUTES } from './routes';

/**
 * Step definition
 */
export interface OnboardingStep {
  /** Unique key for this step */
  key: 'accountType' | 'password' | 'consent' | 'phone';
  /** Route path for this step */
  route: string;
  /** i18n key for step label */
  labelKey: string;
  /** Default label (fallback) */
  defaultLabel: string;
  /** Whether this step is always required */
  required: boolean;
  /** Function to check if step is required for a specific user */
  isRequiredFor?: (user: OnboardingUser) => boolean;
  /** Function to check if step is complete for a specific user */
  isCompleteFor: (user: OnboardingUser, consentStatus?: ConsentStatus) => boolean;
}

/**
 * Minimal user shape for onboarding decisions
 */
export interface OnboardingUser {
  id: string;
  accountTypeConfirmedAt: string | null;
  hasPassword: boolean;
  phoneVerified?: boolean;
}

/**
 * Consent status shape from backend
 */
export interface ConsentStatus {
  hasRequiredConsents: boolean;
  needsReConsent: boolean;
}

/**
 * All onboarding steps in order
 */
export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    key: 'accountType',
    route: ONBOARDING_ROUTES.ACCOUNT_TYPE,
    labelKey: 'onboarding.steps.accountType',
    defaultLabel: 'Account Type',
    required: true,
    isCompleteFor: (user) => !!user.accountTypeConfirmedAt,
  },
  {
    key: 'password',
    route: ONBOARDING_ROUTES.PASSWORD,
    labelKey: 'onboarding.steps.password',
    defaultLabel: 'Secure Your Account',
    required: false,
    isRequiredFor: (user) => user.hasPassword === false,
    isCompleteFor: (user) => user.hasPassword !== false,
  },
  {
    key: 'consent',
    route: ONBOARDING_ROUTES.CONSENT,
    labelKey: 'onboarding.steps.consent',
    defaultLabel: 'Terms & Privacy',
    required: true,
    isCompleteFor: (user, consentStatus) => 
      !!consentStatus && consentStatus.hasRequiredConsents && !consentStatus.needsReConsent,
  },
  {
    key: 'phone',
    route: ONBOARDING_ROUTES.CONSENT, // Phone is handled within ConsentPage step 3
    labelKey: 'onboarding.steps.phone',
    defaultLabel: 'Verify Phone',
    required: false,
    isCompleteFor: (user) => !!user.phoneVerified,
  },
];

/**
 * Get steps required for a specific user
 */
export function getRequiredSteps(user: OnboardingUser): OnboardingStep[] {
  return ONBOARDING_STEPS.filter(step => {
    if (step.required) return true;
    if (step.isRequiredFor) return step.isRequiredFor(user);
    return false;
  });
}

/**
 * Get all steps that should be shown in progress indicator for a user
 * (excludes phone since it's optional and shown within consent page)
 */
export function getVisibleSteps(user: OnboardingUser): OnboardingStep[] {
  return ONBOARDING_STEPS.filter(step => {
    // Phone is handled within consent page, not shown as separate dot
    if (step.key === 'phone') return false;
    // Password only shown if required for this user
    if (step.key === 'password') {
      return step.isRequiredFor ? step.isRequiredFor(user) : step.required;
    }
    return true;
  });
}

/**
 * Get progress information for a step
 */
export function getStepProgress(
  currentStepKey: OnboardingStep['key'],
  user: OnboardingUser
): {
  currentStep: number;
  totalSteps: number;
  percent: number;
  dots: Array<{ key: string; active: boolean; complete: boolean }>;
} {
  const visibleSteps = getVisibleSteps(user);
  const currentIndex = visibleSteps.findIndex(s => s.key === currentStepKey);
  const currentStep = currentIndex + 1;
  const totalSteps = visibleSteps.length;
  
  return {
    currentStep,
    totalSteps,
    percent: totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0,
    dots: visibleSteps.map((step, index) => ({
      key: step.key,
      active: index === currentIndex,
      complete: index < currentIndex,
    })),
  };
}

/**
 * Get step by key
 */
export function getStepByKey(key: OnboardingStep['key']): OnboardingStep | undefined {
  return ONBOARDING_STEPS.find(s => s.key === key);
}

/**
 * Get step by route
 */
export function getStepByRoute(route: string): OnboardingStep | undefined {
  return ONBOARDING_STEPS.find(s => s.route === route);
}
