/**
 * BetaFeedbackChatModal
 * 
 * Conversational chat-style modal for collecting beta feedback.
 * Supports bug reports and feature suggestions.
 * 
 * Vocaid Design System:
 * - White background, zinc borders, purple accents
 * - Chat-style message bubbles with animations
 * - Mobile-first (bottom sheet on mobile)
 */

'use client';

import React, { useEffect, useCallback, useRef, useState, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Send, ChevronLeft, SkipForward, Loader2, Check, Plus, Trash2, Bug, Lightbulb, Sparkles } from 'lucide-react';
import { cn } from 'lib/utils';
import { useBetaFeedbackFlow } from 'hooks/useBetaFeedbackFlow';
import { ChatMessage, WizardStep } from 'types/betaFeedback';

const MIN_TITLE_LENGTH = 5;
const MIN_DESCRIPTION_LENGTH = 10;

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface MessageBubbleProps {
  message: ChatMessage;
  onOptionSelect?: (value: string) => void;
  onTextSubmit?: (value: string) => void;
  onStepsSubmit?: (steps: string[]) => void;
  isLatest: boolean;
  animationDelay?: number;
  currentStep?: WizardStep;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onOptionSelect,
  onTextSubmit,
  onStepsSubmit,
  isLatest,
  animationDelay = 0,
  currentStep,
}) => {
  const { t } = useTranslation();
  const isAssistant = message.role === 'assistant';
  const [inputValue, setInputValue] = useState('');
  const [steps, setSteps] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const trimmedInputValue = inputValue.trim();
  const minLengthRequired = currentStep === 'title'
    ? MIN_TITLE_LENGTH
    : currentStep === 'description'
      ? MIN_DESCRIPTION_LENGTH
      : 0;

  const isTooShort = minLengthRequired > 0 && trimmedInputValue.length > 0 && trimmedInputValue.length < minLengthRequired;
  const canSubmitText = trimmedInputValue.length > 0 && !isTooShort;

  // Animate in
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), animationDelay);
    return () => clearTimeout(timer);
  }, [animationDelay]);

  // Focus input when this becomes the latest assistant message with input
  useEffect(() => {
    if (isLatest && isAssistant && message.inputType && inputRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isLatest, isAssistant, message.inputType]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (message.inputType === 'steps') {
        // Add step on Enter
        if (inputValue.trim()) {
          setSteps(prev => [...prev, inputValue.trim()]);
          setInputValue('');
        }
      } else if (message.inputType !== 'textarea') {
        e.preventDefault();
        if (!trimmedInputValue) return;
        if (isTooShort) {
          setInputError(`Please enter at least ${minLengthRequired} characters.`);
          return;
        }

        setInputError(null);
        onTextSubmit?.(inputValue);
        setInputValue('');
      }
    }
  };

  const handleTextSubmit = () => {
    if (!trimmedInputValue) return;
    if (isTooShort) {
      setInputError(`Please enter at least ${minLengthRequired} characters.`);
      return;
    }

    setInputError(null);
    onTextSubmit?.(inputValue);
    setInputValue('');
  };

  const handleStepsSubmit = () => {
    if (steps.length > 0) {
      onStepsSubmit?.(steps);
      setSteps([]);
    }
  };

  const removeStep = (index: number) => {
    setSteps(prev => prev.filter((_, i) => i !== index));
  };

  // Render markdown-like content (basic bold support)
  const renderContent = (content: string) => {
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      // Handle newlines
      return part.split('\n').map((line, j) => (
        <React.Fragment key={`${i}-${j}`}>
          {j > 0 && <br />}
          {line}
        </React.Fragment>
      ));
    });
  };

  return (
    <div
      className={cn(
        'flex w-full mb-4 transition-all duration-300 ease-out',
        isAssistant ? 'justify-start' : 'justify-end',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      )}
    >
      <div
        className={cn(
          'max-w-[88%] rounded-2xl px-4 py-3 shadow-sm',
          isAssistant
            ? 'bg-gradient-to-br from-zinc-50 to-zinc-100 text-zinc-800 rounded-bl-md border border-zinc-200/60'
            : 'bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-br-md shadow-purple-600/20'
        )}
      >
        {/* Message content */}
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {renderContent(message.content)}
        </div>

        {/* Options (for assistant messages) */}
        {isLatest && isAssistant && message.options && (
          <div className="mt-4 flex flex-col gap-2">
            {message.options.map((option, idx) => (
              <button
                key={option.id}
                onClick={() => onOptionSelect?.(option.value)}
                className={cn(
                  'w-full px-4 py-3 text-left text-sm font-medium',
                  'bg-white border border-zinc-200 rounded-xl',
                  'hover:border-purple-500 hover:bg-purple-50 hover:text-purple-700',
                  'active:scale-[0.98]',
                  'transition-all duration-150',
                  'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1',
                  'group'
                )}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <span className="flex items-center gap-2">
                  {option.value === 'bug' && <Bug className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />}
                  {option.value === 'feature' && <Lightbulb className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />}
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Text/Email input */}
        {isLatest && isAssistant && message.inputType && message.inputType !== 'steps' && !message.options && (
          <div className="mt-4">
            {message.inputType === 'textarea' ? (
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (inputError) setInputError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder={message.inputPlaceholder}
                rows={4}
                className="w-full px-4 py-3 text-sm bg-white border border-zinc-200 rounded-xl
                  placeholder:text-zinc-400
                  focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                  resize-none transition-shadow"
              />
            ) : (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type={message.inputType === 'email' ? 'email' : 'text'}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (inputError) setInputError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder={message.inputPlaceholder}
                className="w-full px-4 py-3 text-sm bg-white border border-zinc-200 rounded-xl
                  placeholder:text-zinc-400
                  focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                  transition-shadow"
              />
            )}

            {isLatest && isAssistant && (inputError || isTooShort) && (
              <div className="mt-2 text-xs text-red-600">
                {inputError || `Please enter at least ${minLengthRequired} characters.`}
              </div>
            )}

            <button
              onClick={handleTextSubmit}
              disabled={!canSubmitText}
              className="mt-3 w-full px-4 py-2.5 text-sm font-medium text-white
                bg-gradient-to-r from-purple-600 to-purple-700 
                hover:from-purple-700 hover:to-purple-800 
                disabled:from-zinc-300 disabled:to-zinc-300 disabled:cursor-not-allowed
                rounded-xl transition-all duration-200
                active:scale-[0.98]
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1
                flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {t('betaFeedback.continue', 'Continue')}
            </button>
          </div>
        )}

        {/* Steps input */}
        {isLatest && isAssistant && message.inputType === 'steps' && (
          <div className="mt-4">
            {/* Current steps */}
            {steps.length > 0 && (
              <div className="mb-3 space-y-2">
                {steps.map((step, i) => (
                  <div 
                    key={i} 
                    className="flex items-start gap-3 text-sm bg-white px-4 py-2.5 rounded-xl border border-zinc-200
                      animate-in fade-in slide-in-from-top-1 duration-200"
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-700 
                      flex items-center justify-center text-xs font-semibold">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-zinc-700">{step}</span>
                    <button
                      onClick={() => removeStep(i)}
                      className="flex-shrink-0 p-1 text-zinc-400 hover:text-red-500 hover:bg-red-50 
                        rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add step input */}
            <div className="flex gap-2">
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={message.inputPlaceholder}
                className="flex-1 px-4 py-3 text-sm bg-white border border-zinc-200 rounded-xl
                  placeholder:text-zinc-400
                  focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                  transition-shadow"
              />
              <button
                onClick={() => {
                  if (inputValue.trim()) {
                    setSteps(prev => [...prev, inputValue.trim()]);
                    setInputValue('');
                    inputRef.current?.focus();
                  }
                }}
                disabled={!inputValue.trim()}
                className="px-4 py-3 bg-zinc-100 hover:bg-zinc-200 disabled:bg-zinc-50 disabled:text-zinc-300
                  text-zinc-700 rounded-xl transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleStepsSubmit}
              disabled={steps.length === 0}
              className="mt-3 w-full px-4 py-2.5 text-sm font-medium text-white
                bg-gradient-to-r from-purple-600 to-purple-700 
                hover:from-purple-700 hover:to-purple-800 
                disabled:from-zinc-300 disabled:to-zinc-300 disabled:cursor-not-allowed
                rounded-xl transition-all duration-200
                active:scale-[0.98]
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1
                flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              {t('betaFeedback.done', 'Done')} 
              {steps.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                  {steps.length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface BetaFeedbackChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BetaFeedbackChatModal: React.FC<BetaFeedbackChatModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  
  const {
    state,
    messages,
    progress,
    initializeChat,
    handleOptionSelect,
    handleTextInput,
    handleStepsInput,
    skipStep,
    previousStep,
    reset,
    canSkip,
    canGoBack,
    isComplete,
    isSubmitting,
  } = useBetaFeedbackFlow();

  // Initialize chat on open
  useEffect(() => {
    if (isOpen) {
      setIsAnimatingIn(true);
      if (messages.length === 0) {
        initializeChat();
      }
    } else {
      setIsAnimatingIn(false);
    }
  }, [isOpen, messages.length, initializeChat]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape as any);
    return () => document.removeEventListener('keydown', handleEscape as any);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Handle close with reset
  const handleClose = useCallback(() => {
    onClose();
    // Reset after animation
    setTimeout(reset, 300);
  }, [onClose, reset]);

  // Get header icon based on feedback type
  const getHeaderIcon = () => {
    if (state.feedbackType === 'bug') {
      return <Bug className="w-5 h-5 text-red-500" />;
    }
    if (state.feedbackType === 'feature') {
      return <Lightbulb className="w-5 h-5 text-amber-500" />;
    }
    return <Sparkles className="w-5 h-5 text-purple-500" />;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-opacity duration-300',
          isAnimatingIn ? 'opacity-100' : 'opacity-0'
        )}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          'fixed z-[9999] transition-all duration-300 ease-out',
          // Mobile: bottom sheet style
          'bottom-0 left-0 right-0 max-h-[92vh] rounded-t-3xl',
          // Desktop: floating window
          'sm:bottom-6 sm:right-6 sm:left-auto sm:top-auto',
          'sm:w-[420px] sm:max-h-[680px] sm:rounded-2xl',
          // Styling
          'bg-white border border-zinc-200 shadow-2xl',
          'flex flex-col overflow-hidden',
          // Animation
          isAnimatingIn 
            ? 'translate-y-0 sm:translate-y-0 opacity-100 scale-100' 
            : 'translate-y-full sm:translate-y-8 opacity-0 sm:scale-95'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="beta-feedback-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-100 bg-gradient-to-r from-zinc-50 to-white">
          <div className="flex items-center gap-3">
            {canGoBack && (
              <button
                onClick={previousStep}
                className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors -ml-1"
                aria-label={t('betaFeedback.back', 'Go back')}
              >
                <ChevronLeft className="w-5 h-5 text-zinc-500" />
              </button>
            )}
            <div className="flex items-center gap-2">
              {getHeaderIcon()}
              <h2 id="beta-feedback-modal-title" className="text-base font-semibold text-zinc-900">
                {state.feedbackType === 'bug' 
                  ? t('betaFeedback.bugReportTitle', 'Bug Report')
                  : state.feedbackType === 'feature'
                  ? t('betaFeedback.featureTitle', 'Feature Suggestion')
                  : t('betaFeedback.title', 'Beta Feedback')}
              </h2>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-zinc-100 rounded-xl transition-colors"
            aria-label={t('common.close', 'Close')}
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-zinc-100 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white to-zinc-50/50">
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              onOptionSelect={handleOptionSelect}
              onTextSubmit={handleTextInput}
              onStepsSubmit={handleStepsInput}
              isLatest={index === messages.length - 1}
              animationDelay={index === messages.length - 1 ? 100 : 0}
              currentStep={state.step}
            />
          ))}

          {/* Submitting indicator */}
          {isSubmitting && (
            <div className="flex justify-start mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 border border-zinc-200/60 
                rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-3 shadow-sm">
                <div className="relative">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                </div>
                <span className="text-sm text-zinc-600">
                  {t('betaFeedback.submitting', 'Submitting your feedback...')}
                </span>
              </div>
            </div>
          )}

          {/* Success indicator */}
          {isComplete && (
            <div className="flex justify-center my-6 animate-in zoom-in-50 duration-300">
              <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-50 to-emerald-50 
                text-green-700 rounded-full border border-green-200 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium">
                  {t('betaFeedback.submitted', 'Feedback submitted!')}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-zinc-100 bg-white flex items-center justify-between gap-4">
          {/* Skip button (for optional fields) */}
          {canSkip && !isComplete && !isSubmitting ? (
            <button
              onClick={skipStep}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-500 
                hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <SkipForward className="w-4 h-4" />
              {t('betaFeedback.skip', 'Skip')}
            </button>
          ) : (
            <div />
          )}

          {/* Close button when complete */}
          {isComplete && (
            <button
              onClick={handleClose}
              className="ml-auto px-5 py-2.5 text-sm font-medium text-white
                bg-gradient-to-r from-purple-600 to-purple-700
                hover:from-purple-700 hover:to-purple-800
                rounded-xl transition-all duration-200 shadow-sm
                active:scale-[0.98]"
            >
              {t('betaFeedback.close', 'Close')}
            </button>
          )}

          {/* Branding */}
          {!isComplete && (
            <span className="text-xs text-zinc-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {t('betaFeedback.powered', 'Powered by Vocaid')}
            </span>
          )}
        </div>
      </div>
    </>
  );
};

export default BetaFeedbackChatModal;
