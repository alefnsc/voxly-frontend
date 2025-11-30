import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useForm, ValidationError } from '@formspree/react';
import { MessageCircle, X, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const FORMSPREE_FORM_ID = 'mqaregzo';

// Validation constants matching Formspree settings
const MESSAGE_MIN_LENGTH = 50;
const MESSAGE_MAX_LENGTH = 250;

const ContactButton: React.FC = () => {
  const location = useLocation();
  const { user, isSignedIn } = useUser();
  const [state, handleFormspreeSubmit] = useForm(FORMSPREE_FORM_ID);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [touched, setTouched] = useState(false);

  // Only show on home (/) and feedback (/feedback) pages
  const allowedPaths = ['/', '/feedback'];
  const shouldShow = allowedPaths.includes(location.pathname);

  const userName = user?.fullName || user?.firstName || 'User';
  const userEmail = user?.primaryEmailAddress?.emailAddress || '';

  // Validation - must be called before any conditional returns
  const messageLength = message.trim().length;
  const validation = useMemo(() => {
    const errors: string[] = [];
    
    if (!userEmail) {
      errors.push('Email is required');
    }
    
    if (messageLength === 0) {
      errors.push('Message is required');
    } else if (messageLength < MESSAGE_MIN_LENGTH) {
      errors.push(`Message must be at least ${MESSAGE_MIN_LENGTH} characters (${MESSAGE_MIN_LENGTH - messageLength} more needed)`);
    } else if (messageLength > MESSAGE_MAX_LENGTH) {
      errors.push(`Message must be less than ${MESSAGE_MAX_LENGTH} characters (${messageLength - MESSAGE_MAX_LENGTH} over limit)`);
    }
    
    return {
      isValid: errors.length === 0 && messageLength >= MESSAGE_MIN_LENGTH && messageLength <= MESSAGE_MAX_LENGTH && !!userEmail,
      errors,
    };
  }, [messageLength, userEmail]);

  // Redirect to thank you page on successful submission
  useEffect(() => {
    if (state.succeeded) {
      const timer = setTimeout(() => {
        window.location.href = '/contact/thank-you';
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.succeeded]);

  // Don't render if not on allowed pages or user not signed in
  // This check must come AFTER all hooks are called
  if (!shouldShow || !isSignedIn) {
    return null;
  }

  // Custom submit handler that validates before letting Formspree handle submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setTouched(true);
    
    // If validation fails, prevent submission
    if (!validation.isValid) {
      e.preventDefault();
      return;
    }
    
    // Let Formspree's handler take over (don't preventDefault here)
    // Formspree will handle CAPTCHA and submission
    handleFormspreeSubmit(e);
  };

  const handleClose = () => {
    setIsOpen(false);
    setMessage('');
    setTouched(false);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    // Prevent typing beyond max length
    if (newValue.length <= MESSAGE_MAX_LENGTH + 10) { // Allow slight overflow for UX
      setMessage(newValue);
    }
  };

  // Character count color
  const getCharCountColor = () => {
    if (messageLength === 0) return 'text-gray-400';
    if (messageLength < MESSAGE_MIN_LENGTH) return 'text-amber-500';
    if (messageLength > MESSAGE_MAX_LENGTH) return 'text-red-500';
    return 'text-green-500';
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50
          w-14 h-14 sm:w-16 sm:h-16
          bg-gradient-to-r from-purple-700 via-purple-600 to-violet-600
          hover:from-purple-800 hover:via-purple-700 hover:to-violet-700
          text-white rounded-full
          shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40
          flex items-center justify-center
          transition-all duration-300 ease-out
          transform hover:scale-110 active:scale-95
          touch-manipulation
          ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
        aria-label="Contact Us"
      >
        <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4 pt-8 sm:pt-4 overflow-y-auto"
          onClick={handleClose}
        >
          {/* Modal Content */}
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all duration-300 animate-slide-up my-auto sm:my-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-violet-600 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Contact Us</h2>
                  <p className="text-sm text-gray-500">We'd love to hear from you</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Form - using Formspree's form handling */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              {/* Hidden fields for Formspree */}
              <input type="hidden" name="_subject" value={`Voxly Feedback from ${userName}`} />
              
              {/* User Info (Read-only but also sent to Formspree) */}
              <div className="space-y-3">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={userName}
                    readOnly
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={userEmail}
                    readOnly
                    required
                    className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-gray-600 cursor-not-allowed ${
                      !userEmail && touched ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  <ValidationError prefix="Email" field="email" errors={state.errors} />
                  {!userEmail && touched && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Email is required
                    </p>
                  )}
                </div>
              </div>

              {/* Message Input */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={message}
                  onChange={handleMessageChange}
                  onBlur={() => setTouched(true)}
                  placeholder="Share your feedback, questions, or suggestions... (minimum 50 characters)"
                  rows={4}
                  required
                  minLength={MESSAGE_MIN_LENGTH}
                  maxLength={MESSAGE_MAX_LENGTH + 10}
                  className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all ${
                    touched && !validation.isValid && messageLength > 0
                      ? messageLength < MESSAGE_MIN_LENGTH
                        ? 'border-amber-300 bg-amber-50/50'
                        : messageLength > MESSAGE_MAX_LENGTH
                        ? 'border-red-300 bg-red-50/50'
                        : 'border-gray-200'
                      : 'border-gray-200'
                  }`}
                />
                <ValidationError prefix="Message" field="message" errors={state.errors} />
                {/* Character count and validation feedback */}
                <div className="mt-1 flex items-center justify-between">
                  <div className="flex-1">
                    {touched && messageLength > 0 && messageLength < MESSAGE_MIN_LENGTH && (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {MESSAGE_MIN_LENGTH - messageLength} more characters needed
                      </p>
                    )}
                    {messageLength > MESSAGE_MAX_LENGTH && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {messageLength - MESSAGE_MAX_LENGTH} characters over limit
                      </p>
                    )}
                    {messageLength >= MESSAGE_MIN_LENGTH && messageLength <= MESSAGE_MAX_LENGTH && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Message looks good!
                      </p>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${getCharCountColor()}`}>
                    {messageLength}/{MESSAGE_MAX_LENGTH}
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {state.errors && Object.keys(state.errors).length > 0 && !state.succeeded && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center">
                  <p className="text-red-600 text-sm">Failed to send message. Please try again.</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={state.submitting || !validation.isValid}
                className={`
                  w-full py-3 px-6 rounded-xl font-bold text-base
                  flex items-center justify-center gap-2
                  transition-all duration-300 ease-out
                  shadow-lg hover:shadow-xl
                  transform hover:scale-[1.02] active:scale-[0.98]
                  disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none
                  touch-manipulation
                  ${state.succeeded
                    ? 'bg-green-500 text-white'
                    : 'bg-gradient-to-r from-purple-700 via-purple-600 to-violet-600 text-white hover:from-purple-800 hover:via-purple-700 hover:to-violet-700 shadow-purple-500/30'
                  }
                `}
              >
                {state.submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : state.succeeded ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Sent!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
              <p className="text-xs text-center text-gray-400">
                Your feedback helps us improve Voxly AI
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CSS for animation */}
      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default ContactButton;
