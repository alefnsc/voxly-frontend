/**
 * Beta Feedback Types
 * 
 * TypeScript definitions for the closed beta feedback system.
 * Supports both Bug Reports and Feature Suggestions.
 */

// ============================================================================
// ENUMS
// ============================================================================

export type FeedbackType = 'bug' | 'feature';

export type BugSeverity = 'low' | 'medium' | 'high' | 'blocking';

export type BugFrequency = 'always' | 'sometimes' | 'once';

export type FeaturePriority = 'nice-to-have' | 'important' | 'critical';

export type FeatureTargetUser = 'self' | 'recruiters' | 'other';

// ============================================================================
// WIZARD STEPS
// ============================================================================

export type WizardStep = 
  | 'choose-type'
  | 'title'
  | 'description'
  // Bug-specific steps
  | 'severity'
  | 'steps-to-reproduce'
  | 'expected-behavior'
  | 'actual-behavior'
  | 'frequency'
  // Feature-specific steps
  | 'goal'
  | 'target-user'
  | 'priority'
  | 'alternatives'
  // Common final steps
  | 'email'
  | 'follow-up'
  | 'review'
  | 'submitting'
  | 'success'
  | 'error';

// ============================================================================
// FORM DATA
// ============================================================================

export interface BugReportData {
  type: 'bug';
  title: string;
  description: string;
  severity: BugSeverity;
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  frequency: BugFrequency;
}

export interface FeatureSuggestionData {
  type: 'feature';
  title: string;
  description: string;
  goal: string;
  targetUser: FeatureTargetUser;
  priority: FeaturePriority;
  alternativesTried: string;
}

export interface CommonFeedbackData {
  // Auto-captured
  pageUrl: string;
  appVersion: string;
  appEnv: 'development' | 'production';
  language: string;
  userAgent: string;
  // User-provided
  userEmail: string;
  userId?: string;
  allowFollowUp: boolean;
  refId: string;
}

export type BetaFeedbackPayload = (BugReportData | FeatureSuggestionData) & CommonFeedbackData;

// ============================================================================
// API TYPES
// ============================================================================

export interface BetaFeedbackRequest {
  type: FeedbackType;
  title: string;
  description: string;
  // Bug-specific
  severity?: BugSeverity;
  stepsToReproduce?: string[];
  expectedBehavior?: string;
  actualBehavior?: string;
  frequency?: BugFrequency;
  // Feature-specific
  goal?: string;
  targetUser?: FeatureTargetUser;
  priority?: FeaturePriority;
  alternativesTried?: string;
  // Common
  pageUrl: string;
  userEmail: string;
  userId?: string;
  language: string;
  appEnv: string;
  appVersion: string;
  userAgent: string;
  allowFollowUp: boolean;
  refId: string;
  // reCAPTCHA v3 token (for Formspree spam protection)
  recaptchaToken?: string;
}

export interface BetaFeedbackResponse {
  ok: boolean;
  refId: string;
  message?: string;
  error?: string;
}

// ============================================================================
// WIZARD STATE
// ============================================================================

export interface BetaFeedbackWizardState {
  step: WizardStep;
  feedbackType: FeedbackType | null;
  // Bug fields
  title: string;
  description: string;
  severity: BugSeverity | null;
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  frequency: BugFrequency | null;
  // Feature fields
  goal: string;
  targetUser: FeatureTargetUser | null;
  priority: FeaturePriority | null;
  alternativesTried: string;
  // Common fields
  userEmail: string;
  allowFollowUp: boolean;
  // Submission state
  isSubmitting: boolean;
  submissionError: string | null;
  refId: string | null;
}

// ============================================================================
// CHAT MESSAGE
// ============================================================================

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  options?: ChatOption[];
  inputType?: 'text' | 'textarea' | 'email' | 'checkbox' | 'steps';
  inputPlaceholder?: string;
}

export interface ChatOption {
  id: string;
  label: string;
  value: string;
  icon?: React.ReactNode;
}
