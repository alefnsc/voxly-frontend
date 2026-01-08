/**
 * Feature Flags Configuration
 * 
 * Centralized feature toggles for the application.
 * Used primarily for the Closed Beta Feedback system.
 * 
 * To revert after beta: Set REACT_APP_CLOSED_BETA_FEEDBACK=false
 */

// ============================================================================
// CLOSED BETA FEEDBACK FLAG
// ============================================================================

/**
 * Check if Closed Beta Feedback mode is enabled
 * When enabled: Shows Bug FAB instead of Contact button
 * When disabled: Shows original Contact Us button
 */
export const isClosedBetaFeedbackEnabled = (): boolean => {
  const flag = process.env.REACT_APP_CLOSED_BETA_FEEDBACK;
  // Default to true during closed beta
  return flag !== 'false';
};

// ============================================================================
// APP VERSION & ENVIRONMENT
// ============================================================================

/**
 * Get the current app version from package.json
 */
export const getAppVersion = (): string => {
  return process.env.REACT_APP_VERSION || '0.7.0';
};

/**
 * Get the current environment
 */
export const getAppEnvironment = (): 'development' | 'production' => {
  return process.env.REACT_APP_ENV === 'production' ? 'production' : 'development';
};

// ============================================================================
// FEATURE FLAG EXPORTS
// ============================================================================

export const FEATURE_FLAGS = {
  CLOSED_BETA_FEEDBACK: isClosedBetaFeedbackEnabled(),
} as const;

export default FEATURE_FLAGS;
