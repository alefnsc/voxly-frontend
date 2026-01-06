/**
 * First-Party Sign-Up Component
 * 
 * Sign-up form using first-party authentication (session-based).
 * Includes email verification flow.
 * 
 * @module components/auth/FirstPartySignUp
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from 'lib/utils';
import { firstPartySignUpSchema, FirstPartySignUpFormData } from './validation';
import { AuthInput } from './AuthInput';
import { FirstPartyAuthButtons, FirstPartyAuthDivider } from './FirstPartyAuthButtons';
import { AuthLegalNotice } from './AuthLegalNotice';
import { B2C_ROUTES } from 'routes/b2cRoutes';
import { useAuth } from 'contexts/AuthContext';

// Form step types
type SignUpStep = 'form' | 'verification' | 'complete';

// Animation variants for form transitions
const fadeVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

interface FirstPartySignUpProps {
  onSuccess?: () => void;
  className?: string;
  /** Show feature pills (for marketing emphasis) */
  showFeaturePills?: boolean;
}

export const FirstPartySignUp: React.FC<FirstPartySignUpProps> = ({
  onSuccess,
  className,
  showFeaturePills = false,
}) => {
  const { signUp, signInWithGoogle, signInWithLinkedIn, signInWithX, verifyEmail, resendVerificationEmail, isLoaded } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  // Form state
  const [step, setStep] = useState<SignUpStep>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLinkedInLoading, setIsLinkedInLoading] = useState(false);
  const [isXLoading, setIsXLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  
  // Form values
  const [formData, setFormData] = useState<FirstPartySignUpFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  
  // Field errors
  const [errors, setErrors] = useState<Partial<Record<keyof FirstPartySignUpFormData, string>>>({});

  // Handle input change
  const handleChange = useCallback((field: keyof FirstPartySignUpFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setGlobalError(null);
  }, []);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const result = firstPartySignUpSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FirstPartySignUpFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FirstPartySignUpFormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    
    setErrors({});
    return true;
  }, [formData]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded) return;
    if (!validateForm()) return;
    
    setIsLoading(true);
    setGlobalError(null);

    try {
      const result = await signUp({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
      });

      if (result.success) {
        if (result.requiresVerification) {
          // Email verification required
          setStep('verification');
        } else {
          // Auto-verified (e.g., Google OAuth) - go to post-login for onboarding
          setStep('complete');
          onSuccess?.();
          setTimeout(() => {
            navigate('/auth/post-login');
          }, 1000);
        }
      } else {
        setGlobalError(result.error || t('auth.errors.signUpFailed', 'Failed to create account. Please try again.'));
      }
    } catch (error: any) {
      console.error('Sign-up error:', error);
      setGlobalError(t('auth.errors.unexpected', 'An unexpected error occurred. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google OAuth
  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setGlobalError(null);
    
    try {
      await signInWithGoogle();
      // This will redirect to Google
    } catch (error: any) {
      console.error('Google sign-up error:', error);
      setGlobalError(t('auth.errors.googleFailed', 'Failed to sign up with Google. Please try again.'));
      setIsGoogleLoading(false);
    }
  };

  // Handle LinkedIn OAuth
  const handleLinkedInSignUp = async () => {
    setIsLinkedInLoading(true);
    setGlobalError(null);
    
    try {
      await signInWithLinkedIn();
      // This will redirect to LinkedIn
    } catch (error: any) {
      console.error('LinkedIn sign-up error:', error);
      setGlobalError(t('auth.errors.linkedinFailed', 'Failed to sign up with LinkedIn. Please try again.'));
      setIsLinkedInLoading(false);
    }
  };

  // Handle X OAuth
  const handleXSignUp = async () => {
    setIsXLoading(true);
    setGlobalError(null);
    
    try {
      await signInWithX();
      // This will redirect to X
    } catch (error: any) {
      console.error('X sign-up error:', error);
      setGlobalError(t('auth.errors.xFailed', 'Failed to sign up with X. Please try again.'));
      setIsXLoading(false);
    }
  };

  // Handle resend verification email
  const handleResendVerification = async () => {
    setIsResending(true);
    setResendMessage(null);
    
    try {
      const result = await resendVerificationEmail(formData.email);
      if (result.success) {
        setResendMessage(t('auth.verification.resent', 'Verification email sent! Check your inbox.'));
      } else {
        setResendMessage(result.error || t('auth.verification.resendFailed', 'Failed to resend email.'));
      }
    } catch (error) {
      setResendMessage(t('auth.verification.resendFailed', 'Failed to resend email.'));
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    const code = verificationCode.trim();
    if (!formData.email) {
      setResendMessage(t('auth.verification.missingEmail', 'Missing email. Please sign up again.'));
      return;
    }
    if (!/^[0-9]{6}$/.test(code)) {
      setResendMessage(t('auth.verification.invalidCode', 'Enter the 6-digit verification code.'));
      return;
    }

    setIsVerifying(true);
    setGlobalError(null);
    setResendMessage(null);

    try {
      const result = await verifyEmail(formData.email, code);
      if (result.success) {
        setStep('complete');
        onSuccess?.();
        setTimeout(() => {
          navigate('/auth/post-login');
        }, 500);
      } else {
        setResendMessage(result.error || t('auth.verification.verifyFailed', 'Verification failed. Please try again.'));
      }
    } catch (error: any) {
      setResendMessage(
        error?.message || t('auth.verification.verifyFailed', 'Verification failed. Please try again.')
      );
    } finally {
      setIsVerifying(false);
    }
  };

  // Animation settings
  const animationProps = prefersReducedMotion
    ? {}
    : {
        initial: 'initial',
        animate: 'animate',
        exit: 'exit',
        variants: fadeVariants,
        transition: { duration: 0.2 },
      };

  // ========================================
  // RENDER: VERIFICATION PENDING
  // ========================================
  if (step === 'verification') {
    return (
      <motion.div
        {...animationProps}
        className={cn('flex flex-col items-center justify-center py-8', className)}
      >
        <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4">
          <svg
            className="h-8 w-8 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t('auth.verification.title', 'Check your email')}
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
          {t('auth.verification.message', "We've sent a verification code to")}{' '}
          <strong>{formData.email}</strong>
        </p>

        <form onSubmit={handleVerifyCode} className="mt-6 w-full max-w-sm space-y-3">
          <AuthInput
            label={t('auth.verification.codeLabel', 'Verification code')}
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder={t('auth.verification.codePlaceholder', '6-digit code')}
            autoComplete="one-time-code"
            disabled={isVerifying}
            required
          />
          <button
            type="submit"
            disabled={isVerifying}
            className={cn(
              'w-full px-4 py-2 text-sm font-medium rounded-lg',
              'bg-zinc-900 text-white hover:bg-zinc-800 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isVerifying
              ? t('auth.verification.verifying', 'Verifying...')
              : t('auth.verification.verify', 'Verify')}
          </button>
        </form>
        
        {/* Resend Button */}
        <button
          onClick={handleResendVerification}
          disabled={isResending}
          className={cn(
            'mt-6 px-4 py-2 text-sm font-medium rounded-lg',
            'text-primary hover:bg-primary/10 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isResending ? t('auth.verification.resending', 'Sending...') : t('auth.verification.resend', 'Resend verification email')}
        </button>
        
        {resendMessage && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{resendMessage}</p>
        )}
        
        {/* Back to Sign In */}
        <Link
          to="/sign-in"
          className="mt-4 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {t('auth.verification.backToSignIn', 'Back to sign in')}
        </Link>
      </motion.div>
    );
  }

  // ========================================
  // RENDER: COMPLETE STATE
  // ========================================
  if (step === 'complete') {
    return (
      <motion.div
        {...animationProps}
        className={cn('flex flex-col items-center justify-center py-8', className)}
      >
        <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
          <svg
            className="h-8 w-8 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t('auth.signUp.success', 'Account created!')}
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {t('auth.signUp.redirecting', 'Redirecting you to your dashboard...')}
        </p>
      </motion.div>
    );
  }

  // ========================================
  // RENDER: SIGN-UP FORM
  // ========================================
  return (
    <AnimatePresence mode="wait">
      <motion.div {...animationProps} className={cn('w-full', className)}>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('auth.signUp.title', 'Create your account')}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t('auth.signUp.subtitle', 'Start practicing interviews with AI')}
          </p>
        </div>

        {/* OAuth Buttons */}
        <FirstPartyAuthButtons
          onGoogleClick={handleGoogleSignUp}
          onLinkedInClick={handleLinkedInSignUp}
          onXClick={handleXSignUp}
          isGoogleLoading={isGoogleLoading}
          isLinkedInLoading={isLinkedInLoading}
          isXLoading={isXLoading}
          disabled={isLoading}
        />

        <FirstPartyAuthDivider />

        {/* Global Error */}
        {globalError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          >
            <p className="text-sm text-red-600 dark:text-red-400">{globalError}</p>
          </motion.div>
        )}

        {/* Sign-Up Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Fields (Optional) */}
          <div className="grid grid-cols-2 gap-4">
            <AuthInput
              label={t('auth.fields.firstName', 'First name')}
              type="text"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              error={errors.firstName}
              placeholder="John"
              autoComplete="given-name"
              disabled={isLoading}
            />
            <AuthInput
              label={t('auth.fields.lastName', 'Last name')}
              type="text"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              error={errors.lastName}
              placeholder="Doe"
              autoComplete="family-name"
              disabled={isLoading}
            />
          </div>

          <AuthInput
            label={t('auth.fields.email', 'Email address')}
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={errors.email}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isLoading}
            required
          />

          <AuthInput
            label={t('auth.fields.password', 'Password')}
            type="password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            error={errors.password}
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isLoading}
            required
          />

          <AuthInput
            label={t('auth.fields.confirmPassword', 'Confirm password')}
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            error={errors.confirmPassword}
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isLoading}
            required
          />

          {/* Password Requirements */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t('auth.signUp.passwordRequirements', 'Password must be at least 8 characters with uppercase, lowercase, and number')}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              'w-full py-3 px-4 rounded-xl font-medium text-white',
              'bg-primary hover:bg-primary/90 focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-2'
            )}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                {t('auth.signUp.creating', 'Creating account...')}
              </>
            ) : (
              t('auth.signUp.submit', 'Create account')
            )}
          </button>
        </form>

        {/* Sign In Link */}
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          {t('auth.signUp.hasAccount', 'Already have an account?')}{' '}
          <Link
            to="/sign-in"
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {t('auth.signUp.signIn', 'Sign in')}
          </Link>
        </p>

        {/* Legal Notice */}
        <AuthLegalNotice className="mt-6" />
      </motion.div>
    </AnimatePresence>
  );
};

export default FirstPartySignUp;
