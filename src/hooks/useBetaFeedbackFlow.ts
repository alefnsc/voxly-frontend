/**
 * useBetaFeedbackFlow Hook
 * 
 * State machine for the conversational beta feedback wizard.
 * Handles step navigation, data collection, and submission.
 */

import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '@clerk/clerk-react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { v4 as uuidv4 } from 'uuid';
import { 
  WizardStep, 
  FeedbackType, 
  BugSeverity, 
  BugFrequency, 
  FeaturePriority,
  FeatureTargetUser,
  BetaFeedbackWizardState,
  BetaFeedbackRequest,
  ChatMessage,
  ChatOption,
} from 'types/betaFeedback';
import { getAppVersion, getAppEnvironment } from 'config/featureFlags';
import { submitBetaFeedback } from 'services/betaFeedbackApi';

// ============================================================================
// STEP CONFIGURATION
// ============================================================================

const BUG_STEPS: WizardStep[] = [
  'choose-type',
  'title',
  'description',
  'severity',
  'steps-to-reproduce',
  'expected-behavior',
  'actual-behavior',
  'frequency',
  'email',
  'follow-up',
  'review',
];

const FEATURE_STEPS: WizardStep[] = [
  'choose-type',
  'title',
  'description',
  'goal',
  'target-user',
  'priority',
  'alternatives',
  'email',
  'follow-up',
  'review',
];

// ============================================================================
// INITIAL STATE
// ============================================================================

const createInitialState = (): BetaFeedbackWizardState => ({
  step: 'choose-type',
  feedbackType: null,
  title: '',
  description: '',
  severity: null,
  stepsToReproduce: [],
  expectedBehavior: '',
  actualBehavior: '',
  frequency: null,
  goal: '',
  targetUser: null,
  priority: null,
  alternativesTried: '',
  userEmail: '',
  allowFollowUp: true,
  isSubmitting: false,
  submissionError: null,
  refId: null,
});

// ============================================================================
// HOOK
// ============================================================================

export function useBetaFeedbackFlow() {
  const { t, i18n } = useTranslation();
  const { user, isSignedIn } = useUser();
  const { executeRecaptcha } = useGoogleReCaptcha();
  
  const [state, setState] = useState<BetaFeedbackWizardState>(() => {
    const initial = createInitialState();
    // Prefill email from Clerk if available
    if (user?.primaryEmailAddress?.emailAddress) {
      initial.userEmail = user.primaryEmailAddress.emailAddress;
    }
    return initial;
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Get current step sequence based on feedback type
  const stepSequence = useMemo(() => {
    if (state.feedbackType === 'bug') return BUG_STEPS;
    if (state.feedbackType === 'feature') return FEATURE_STEPS;
    return ['choose-type'] as WizardStep[];
  }, [state.feedbackType]);

  // Get current step index
  const currentStepIndex = stepSequence.indexOf(state.step);
  
  // Progress percentage
  const progress = useMemo(() => {
    if (state.step === 'success') return 100;
    if (state.step === 'error') return currentStepIndex / stepSequence.length * 100;
    return Math.round((currentStepIndex / (stepSequence.length - 1)) * 100);
  }, [currentStepIndex, stepSequence.length, state.step]);

  // ============================================================================
  // MESSAGE GENERATION
  // ============================================================================

  const addAssistantMessage = useCallback((
    content: string, 
    options?: ChatOption[], 
    inputType?: ChatMessage['inputType'],
    inputPlaceholder?: string
  ) => {
    const message: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      options,
      inputType,
      inputPlaceholder,
    };
    setMessages(prev => [...prev, message]);
  }, []);

  const addUserMessage = useCallback((content: string) => {
    const message: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
  }, []);

  // ============================================================================
  // STEP HANDLERS
  // ============================================================================

  const initializeChat = useCallback(() => {
    setMessages([]);
    addAssistantMessage(
      t('betaFeedback.welcome', "Hi! 👋 I'm here to collect your feedback during our closed beta. What would you like to share?"),
      [
        { id: 'bug', label: t('betaFeedback.reportBug', '🐛 Report a Bug'), value: 'bug' },
        { id: 'feature', label: t('betaFeedback.suggestFeature', '💡 Suggest a Feature'), value: 'feature' },
      ]
    );
  }, [t, addAssistantMessage]);

  const goToStep = useCallback((step: WizardStep) => {
    setState(prev => ({ ...prev, step }));

    // Add appropriate message for the step
    switch (step) {
      case 'title':
        addAssistantMessage(
          state.feedbackType === 'bug'
            ? t('betaFeedback.bugTitle', "Got it! What's a brief title for this bug?")
            : t('betaFeedback.featureTitle', "Great! What's a brief title for your feature idea?"),
          undefined,
          'text',
          state.feedbackType === 'bug' 
            ? t('betaFeedback.bugTitlePlaceholder', 'e.g., Button not working on mobile')
            : t('betaFeedback.featureTitlePlaceholder', 'e.g., Dark mode support')
        );
        break;

      case 'description':
        addAssistantMessage(
          state.feedbackType === 'bug'
            ? t('betaFeedback.bugDescription', "Please describe the bug in more detail. What happened?")
            : t('betaFeedback.featureDescription', "Please describe your feature idea in more detail."),
          undefined,
          'textarea',
          t('betaFeedback.descriptionPlaceholder', 'Provide as much detail as you can...')
        );
        break;

      case 'severity':
        addAssistantMessage(
          t('betaFeedback.severityQuestion', "How severe is this bug?"),
          [
            { id: 'low', label: t('betaFeedback.severityLow', '🟢 Low - Minor inconvenience'), value: 'low' },
            { id: 'medium', label: t('betaFeedback.severityMedium', '🟡 Medium - Affects functionality'), value: 'medium' },
            { id: 'high', label: t('betaFeedback.severityHigh', '🟠 High - Major issue'), value: 'high' },
            { id: 'blocking', label: t('betaFeedback.severityBlocking', '🔴 Blocking - Can\'t use the app'), value: 'blocking' },
          ]
        );
        break;

      case 'steps-to-reproduce':
        addAssistantMessage(
          t('betaFeedback.stepsQuestion', "What steps lead to this bug? (Enter each step, press Enter, then click 'Done' when finished)"),
          undefined,
          'steps',
          t('betaFeedback.stepsPlaceholder', 'Enter step and press Enter...')
        );
        break;

      case 'expected-behavior':
        addAssistantMessage(
          t('betaFeedback.expectedQuestion', "What did you expect to happen?"),
          undefined,
          'textarea',
          t('betaFeedback.expectedPlaceholder', 'I expected...')
        );
        break;

      case 'actual-behavior':
        addAssistantMessage(
          t('betaFeedback.actualQuestion', "What actually happened instead?"),
          undefined,
          'textarea',
          t('betaFeedback.actualPlaceholder', 'Instead, what happened was...')
        );
        break;

      case 'frequency':
        addAssistantMessage(
          t('betaFeedback.frequencyQuestion', "How often does this happen?"),
          [
            { id: 'always', label: t('betaFeedback.frequencyAlways', 'Every time'), value: 'always' },
            { id: 'sometimes', label: t('betaFeedback.frequencySometimes', 'Sometimes'), value: 'sometimes' },
            { id: 'once', label: t('betaFeedback.frequencyOnce', 'Just once'), value: 'once' },
          ]
        );
        break;

      case 'goal':
        addAssistantMessage(
          t('betaFeedback.goalQuestion', "What problem would this feature solve for you?"),
          undefined,
          'textarea',
          t('betaFeedback.goalPlaceholder', 'This would help me...')
        );
        break;

      case 'target-user':
        addAssistantMessage(
          t('betaFeedback.targetUserQuestion', "Who would benefit from this feature?"),
          [
            { id: 'self', label: t('betaFeedback.targetSelf', '👤 Just me'), value: 'self' },
            { id: 'recruiters', label: t('betaFeedback.targetRecruiters', '👥 Recruiters/HR'), value: 'recruiters' },
            { id: 'other', label: t('betaFeedback.targetOther', '🌐 Everyone'), value: 'other' },
          ]
        );
        break;

      case 'priority':
        addAssistantMessage(
          t('betaFeedback.priorityQuestion', "How important is this feature to you?"),
          [
            { id: 'nice-to-have', label: t('betaFeedback.priorityNice', '💭 Nice to have'), value: 'nice-to-have' },
            { id: 'important', label: t('betaFeedback.priorityImportant', '⭐ Important'), value: 'important' },
            { id: 'critical', label: t('betaFeedback.priorityCritical', '🔥 Critical for my workflow'), value: 'critical' },
          ]
        );
        break;

      case 'alternatives':
        addAssistantMessage(
          t('betaFeedback.alternativesQuestion', "Have you tried any workarounds or alternatives? (optional)"),
          undefined,
          'textarea',
          t('betaFeedback.alternativesPlaceholder', 'I tried... (or leave blank)')
        );
        break;

      case 'email':
        addAssistantMessage(
          t('betaFeedback.emailQuestion', "What's your email so we can follow up if needed?"),
          undefined,
          'email',
          t('betaFeedback.emailPlaceholder', 'your@email.com')
        );
        break;

      case 'follow-up':
        addAssistantMessage(
          t('betaFeedback.followUpQuestion', "Can we contact you about this feedback?"),
          [
            { id: 'yes', label: t('betaFeedback.followUpYes', '✅ Yes, please reach out'), value: 'true' },
            { id: 'no', label: t('betaFeedback.followUpNo', '❌ No, just log it'), value: 'false' },
          ]
        );
        break;

      case 'review':
        const reviewSummary = buildReviewSummary();
        addAssistantMessage(
          t('betaFeedback.reviewMessage', "Here's a summary of your feedback:") + '\n\n' + reviewSummary,
          [
            { id: 'submit', label: t('betaFeedback.submitButton', '📤 Submit Feedback'), value: 'submit' },
            { id: 'edit', label: t('betaFeedback.editButton', '✏️ Edit'), value: 'edit' },
          ]
        );
        break;

      case 'success':
        addAssistantMessage(
          t('betaFeedback.successMessage', `Thank you! Your feedback has been submitted. 🎉\n\nReference ID: **${state.refId}**\n\nWe really appreciate you helping us improve Vocaid!`)
        );
        break;

      case 'error':
        addAssistantMessage(
          t('betaFeedback.errorMessage', `Sorry, there was an error submitting your feedback: ${state.submissionError}\n\nPlease try again.`),
          [
            { id: 'retry', label: t('betaFeedback.retryButton', '🔄 Try Again'), value: 'retry' },
          ]
        );
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.feedbackType, state.refId, state.submissionError, t, addAssistantMessage]);

  // Build review summary
  const buildReviewSummary = useCallback(() => {
    const lines: string[] = [];
    
    lines.push(`**${t('betaFeedback.type', 'Type')}:** ${state.feedbackType === 'bug' ? '🐛 Bug Report' : '💡 Feature Suggestion'}`);
    lines.push(`**${t('betaFeedback.titleLabel', 'Title')}:** ${state.title}`);
    lines.push(`**${t('betaFeedback.descriptionLabel', 'Description')}:** ${state.description}`);
    
    if (state.feedbackType === 'bug') {
      lines.push(`**${t('betaFeedback.severityLabel', 'Severity')}:** ${state.severity}`);
      if (state.stepsToReproduce.length > 0) {
        lines.push(`**${t('betaFeedback.stepsLabel', 'Steps')}:** ${state.stepsToReproduce.length} steps`);
      }
      if (state.expectedBehavior) {
        lines.push(`**${t('betaFeedback.expectedLabel', 'Expected')}:** ${state.expectedBehavior.slice(0, 50)}...`);
      }
      if (state.frequency) {
        lines.push(`**${t('betaFeedback.frequencyLabel', 'Frequency')}:** ${state.frequency}`);
      }
    } else {
      if (state.priority) {
        lines.push(`**${t('betaFeedback.priorityLabel', 'Priority')}:** ${state.priority}`);
      }
      if (state.targetUser) {
        lines.push(`**${t('betaFeedback.targetUserLabel', 'For')}:** ${state.targetUser}`);
      }
      if (state.goal) {
        lines.push(`**${t('betaFeedback.goalLabel', 'Goal')}:** ${state.goal.slice(0, 50)}...`);
      }
    }
    
    lines.push(`**${t('betaFeedback.emailLabel', 'Email')}:** ${state.userEmail}`);
    lines.push(`**${t('betaFeedback.followUpLabel', 'Follow-up')}:** ${state.allowFollowUp ? 'Yes' : 'No'}`);
    
    return lines.join('\n');
  }, [state, t]);

  // Navigate to next step
  const nextStep = useCallback(() => {
    const currentIndex = stepSequence.indexOf(state.step);
    if (currentIndex < stepSequence.length - 1) {
      goToStep(stepSequence[currentIndex + 1]);
    }
  }, [state.step, stepSequence, goToStep]);

  // Navigate to previous step
  const previousStep = useCallback(() => {
    const currentIndex = stepSequence.indexOf(state.step);
    if (currentIndex > 0) {
      goToStep(stepSequence[currentIndex - 1]);
    }
  }, [state.step, stepSequence, goToStep]);

  // ============================================================================
  // VALUE HANDLERS
  // ============================================================================

  const handleOptionSelect = useCallback((value: string) => {
    const step = state.step;

    // Add user message for the selection
    const labelMap: Record<string, Record<string, string>> = {
      'choose-type': { bug: '🐛 Report a Bug', feature: '💡 Suggest a Feature' },
      severity: { low: '🟢 Low', medium: '🟡 Medium', high: '🟠 High', blocking: '🔴 Blocking' },
      frequency: { always: 'Every time', sometimes: 'Sometimes', once: 'Just once' },
      'target-user': { self: '👤 Just me', recruiters: '👥 Recruiters/HR', other: '🌐 Everyone' },
      priority: { 'nice-to-have': '💭 Nice to have', important: '⭐ Important', critical: '🔥 Critical' },
      'follow-up': { true: '✅ Yes', false: '❌ No' },
    };

    addUserMessage(labelMap[step]?.[value] || value);

    switch (step) {
      case 'choose-type':
        setState(prev => ({ ...prev, feedbackType: value as FeedbackType }));
        // Move to title step after a small delay
        setTimeout(() => goToStep('title'), 300);
        break;

      case 'severity':
        setState(prev => ({ ...prev, severity: value as BugSeverity }));
        setTimeout(nextStep, 300);
        break;

      case 'frequency':
        setState(prev => ({ ...prev, frequency: value as BugFrequency }));
        setTimeout(nextStep, 300);
        break;

      case 'target-user':
        setState(prev => ({ ...prev, targetUser: value as FeatureTargetUser }));
        setTimeout(nextStep, 300);
        break;

      case 'priority':
        setState(prev => ({ ...prev, priority: value as FeaturePriority }));
        setTimeout(nextStep, 300);
        break;

      case 'follow-up':
        setState(prev => ({ ...prev, allowFollowUp: value === 'true' }));
        setTimeout(nextStep, 300);
        break;

      case 'review':
        if (value === 'submit') {
          handleSubmit();
        } else if (value === 'edit') {
          // Go back to title to re-edit
          goToStep('title');
        }
        break;

      case 'error':
        if (value === 'retry') {
          handleSubmit();
        }
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step, addUserMessage, goToStep, nextStep]);

  const handleTextInput = useCallback((value: string) => {
    const step = state.step;
    const trimmedValue = value.trim();

    // Add user message (truncated for display)
    addUserMessage(trimmedValue.length > 100 ? trimmedValue.slice(0, 100) + '...' : trimmedValue);

    switch (step) {
      case 'title':
        setState(prev => ({ ...prev, title: trimmedValue }));
        setTimeout(nextStep, 300);
        break;

      case 'description':
        setState(prev => ({ ...prev, description: trimmedValue }));
        setTimeout(nextStep, 300);
        break;

      case 'expected-behavior':
        setState(prev => ({ ...prev, expectedBehavior: trimmedValue }));
        setTimeout(nextStep, 300);
        break;

      case 'actual-behavior':
        setState(prev => ({ ...prev, actualBehavior: trimmedValue }));
        setTimeout(nextStep, 300);
        break;

      case 'goal':
        setState(prev => ({ ...prev, goal: trimmedValue }));
        setTimeout(nextStep, 300);
        break;

      case 'alternatives':
        setState(prev => ({ ...prev, alternativesTried: trimmedValue }));
        setTimeout(nextStep, 300);
        break;

      case 'email':
        setState(prev => ({ ...prev, userEmail: trimmedValue }));
        setTimeout(nextStep, 300);
        break;
    }
  }, [state.step, addUserMessage, nextStep]);

  const handleStepsInput = useCallback((steps: string[]) => {
    setState(prev => ({ ...prev, stepsToReproduce: steps }));
    addUserMessage(`${steps.length} step(s) added`);
    setTimeout(nextStep, 300);
  }, [addUserMessage, nextStep]);

  // Skip current step (for optional fields)
  const skipStep = useCallback(() => {
    addUserMessage(t('betaFeedback.skipped', '(Skipped)'));
    setTimeout(nextStep, 300);
  }, [addUserMessage, nextStep, t]);

  // ============================================================================
  // SUBMISSION
  // ============================================================================

  const handleSubmit = useCallback(async () => {
    // Client-side validation: title must not be empty
    if (!state.title.trim()) {
      setState(prev => ({ 
        ...prev, 
        step: 'error', 
        isSubmitting: false, 
        submissionError: 'Title is required',
      }));
      goToStep('error');
      return;
    }

    setState(prev => ({ ...prev, step: 'submitting', isSubmitting: true, submissionError: null }));

    const refId = uuidv4();
    
    // Get reCAPTCHA v3 token for spam protection
    let recaptchaToken: string | undefined;
    if (executeRecaptcha) {
      try {
        recaptchaToken = await executeRecaptcha('beta_feedback');
        if (process.env.NODE_ENV === 'development') {
          console.log('[BetaFeedback] reCAPTCHA token acquired');
        }
      } catch (err) {
        console.warn('[BetaFeedback] reCAPTCHA failed, continuing without token:', err);
      }
    }
    
    // Dev logging (non-PII: only type and metadata)
    if (process.env.NODE_ENV === 'development') {
      console.log('[BetaFeedback] Submitting feedback:', {
        type: state.feedbackType,
        tag: state.feedbackType === 'bug' ? '[Bug]' : '[Feature]',
        hasTitle: !!state.title,
        hasDescription: !!state.description,
        hasRecaptcha: !!recaptchaToken,
        refId,
      });
    }

    const payload: BetaFeedbackRequest = {
      type: state.feedbackType!,
      title: state.title.trim(),
      description: state.description,
      pageUrl: window.location.href,
      userEmail: state.userEmail,
      userId: isSignedIn && user?.id ? user.id : undefined,
      language: i18n.language,
      appEnv: getAppEnvironment(),
      appVersion: getAppVersion(),
      userAgent: navigator.userAgent,
      allowFollowUp: state.allowFollowUp,
      refId,
      recaptchaToken,
    };

    // Add type-specific fields
    if (state.feedbackType === 'bug') {
      payload.severity = state.severity!;
      payload.stepsToReproduce = state.stepsToReproduce;
      payload.expectedBehavior = state.expectedBehavior;
      payload.actualBehavior = state.actualBehavior;
      payload.frequency = state.frequency || undefined;
    } else {
      payload.goal = state.goal;
      payload.targetUser = state.targetUser || undefined;
      payload.priority = state.priority || undefined;
      payload.alternativesTried = state.alternativesTried;
    }

    try {
      const result = await submitBetaFeedback(payload);

      if (result.ok) {
        // Dev logging for success (non-PII)
        if (process.env.NODE_ENV === 'development') {
          console.log('[BetaFeedback] Submission successful:', {
            type: state.feedbackType,
            refId: result.refId,
          });
        }
        
        setState(prev => ({ 
          ...prev, 
          step: 'success', 
          isSubmitting: false, 
          refId: result.refId 
        }));
        goToStep('success');
      } else {
        // Dev logging for error (non-PII)
        if (process.env.NODE_ENV === 'development') {
          console.error('[BetaFeedback] Submission failed:', {
            type: state.feedbackType,
            error: result.error,
            refId,
          });
        }
        
        setState(prev => ({ 
          ...prev, 
          step: 'error', 
          isSubmitting: false, 
          submissionError: result.error || 'Unknown error',
          refId,
        }));
        goToStep('error');
      }
    } catch (error) {
      // Dev logging for network error (non-PII)
      if (process.env.NODE_ENV === 'development') {
        console.error('[BetaFeedback] Network error:', {
          type: state.feedbackType,
          error: error instanceof Error ? error.message : 'Unknown',
          refId,
        });
      }
      
      setState(prev => ({ 
        ...prev, 
        step: 'error', 
        isSubmitting: false, 
        submissionError: 'Network error. Please try again.',
        refId,
      }));
      goToStep('error');
    }
  }, [state, isSignedIn, user, i18n.language, goToStep, executeRecaptcha]);

  // ============================================================================
  // RESET
  // ============================================================================

  const reset = useCallback(() => {
    const initial = createInitialState();
    if (user?.primaryEmailAddress?.emailAddress) {
      initial.userEmail = user.primaryEmailAddress.emailAddress;
    }
    setState(initial);
    setMessages([]);
    initializeChat();
  }, [user, initializeChat]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State
    state,
    messages,
    progress,
    currentStepIndex,
    totalSteps: stepSequence.length,
    
    // Actions
    initializeChat,
    handleOptionSelect,
    handleTextInput,
    handleStepsInput,
    skipStep,
    previousStep,
    reset,
    
    // Computed
    canSkip: ['steps-to-reproduce', 'expected-behavior', 'actual-behavior', 'alternatives'].includes(state.step),
    canGoBack: currentStepIndex > 0 && !['success', 'error', 'submitting'].includes(state.step),
    isComplete: state.step === 'success',
    isSubmitting: state.isSubmitting,
  };
}

export type UseBetaFeedbackFlow = ReturnType<typeof useBetaFeedbackFlow>;
