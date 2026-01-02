/**
 * Credits Configuration
 * 
 * Centralized config for credit-related values.
 * Uses environment variables with sensible defaults.
 */

/**
 * Number of free trial credits for new users
 * Can be configured via REACT_APP_FREE_TRIAL_CREDITS env var
 * Default: 5 credits for new signups
 */
export const FREE_TRIAL_CREDITS = parseInt(
  process.env.REACT_APP_FREE_TRIAL_CREDITS || '5',
  10
);

/**
 * Minimum interview duration (ms) to navigate to feedback page
 */
export const MIN_INTERVIEW_DURATION_MS = parseInt(
  process.env.REACT_APP_MIN_INTERVIEW_DURATION_MS || '30000',
  10
);

/**
 * Grace period (ms) for credit restoration if user quits early
 */
export const CREDIT_RESTORATION_THRESHOLD_MS = parseInt(
  process.env.REACT_APP_CREDIT_RESTORATION_THRESHOLD_MS || '15000',
  10
);

/**
 * Helper function to format credit text
 */
export function formatCreditsText(count: number = FREE_TRIAL_CREDITS): string {
  return count === 1 ? '1 credit' : `${count} credits`;
}

/**
 * Get the CTA text for signup buttons
 */
export function getSignupCTA(): string {
  return `Start free — ${formatCreditsText(FREE_TRIAL_CREDITS)} included`;
}

const creditsConfig = {
  FREE_TRIAL_CREDITS,
  MIN_INTERVIEW_DURATION_MS,
  CREDIT_RESTORATION_THRESHOLD_MS,
  formatCreditsText,
  getSignupCTA,
};

export default creditsConfig;
