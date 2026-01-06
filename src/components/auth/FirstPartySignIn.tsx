/**
 * First-Party Sign-In Component
 * 
 * Sign-in form using first-party authentication (session-based).
 * Uses `AuthContext` for authentication.
 * 
 * @module components/auth/FirstPartySignIn
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from 'lib/utils';
import { signInSchema, SignInFormData } from './validation';
import { AuthInput } from './AuthInput';
import { FirstPartyAuthButtons, FirstPartyAuthDivider } from './FirstPartyAuthButtons';
import { AuthLegalNotice } from './AuthLegalNotice';
import { B2C_ROUTES } from 'routes/b2cRoutes';
import { useAuth } from 'contexts/AuthContext';

// Form step types
type SignInStep = 'form' | 'complete';

// Animation variants for form transitions
const fadeVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

interface FirstPartySignInProps {
  onSuccess?: () => void;
  className?: string;
}

export const FirstPartySignIn: React.FC<FirstPartySignInProps> = ({
  onSuccess,
  className,
}) => {
  const { signIn, signInWithGoogle, signInWithLinkedIn, signInWithX, isLoaded } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  // Form state
  const [step, setStep] = useState<SignInStep>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLinkedInLoading, setIsLinkedInLoading] = useState(false);
  const [isXLoading, setIsXLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  
  // Form values
  const [formData, setFormData] = useState<SignInFormData>({
    email: '',
    password: '',
  });
  
  // Field errors
  const [errors, setErrors] = useState<Partial<Record<keyof SignInFormData, string>>>({});

  // Handle input change
  const handleChange = useCallback((field: keyof SignInFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setGlobalError(null);
  }, []);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const result = signInSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SignInFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof SignInFormData;
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
      const result = await signIn({
        email: formData.email,
        password: formData.password,
      });

      if (result.success) {
        setStep('complete');
        onSuccess?.();
        
        // Navigate to post-login router for onboarding checks
        setTimeout(() => {
          navigate('/auth/post-login');
        }, 500);
      } else {
        setGlobalError(result.error || t('auth.errors.invalidCredentials', 'Invalid email or password. Please try again.'));
      }
    } catch (error: any) {
      console.error('Sign-in error:', error);
      setGlobalError(t('auth.errors.unexpected', 'An unexpected error occurred. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google OAuth
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setGlobalError(null);
    
    try {
      await signInWithGoogle();
      // This will redirect to Google, so we don't need to do anything else
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      setGlobalError(t('auth.errors.googleFailed', 'Failed to sign in with Google. Please try again.'));
      setIsGoogleLoading(false);
    }
  };

  // Handle LinkedIn OAuth
  const handleLinkedInSignIn = async () => {
    setIsLinkedInLoading(true);
    setGlobalError(null);
    
    try {
      await signInWithLinkedIn();
      // This will redirect to LinkedIn, so we don't need to do anything else
    } catch (error: any) {
      console.error('LinkedIn sign-in error:', error);
      setGlobalError(t('auth.errors.linkedinFailed', 'Failed to sign in with LinkedIn. Please try again.'));
      setIsLinkedInLoading(false);
    }
  };

  // Handle X OAuth
  const handleXSignIn = async () => {
    setIsXLoading(true);
    setGlobalError(null);
    
    try {
      await signInWithX();
      // This will redirect to X, so we don't need to do anything else
    } catch (error: any) {
      console.error('X sign-in error:', error);
      setGlobalError(t('auth.errors.xFailed', 'Failed to sign in with X. Please try again.'));
      setIsXLoading(false);
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
          {t('auth.signIn.success', 'Welcome back!')}
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {t('auth.signIn.redirecting', 'Redirecting you to your dashboard...')}
        </p>
      </motion.div>
    );
  }

  // ========================================
  // RENDER: SIGN-IN FORM
  // ========================================
  return (
    <AnimatePresence mode="wait">
      <motion.div {...animationProps} className={cn('w-full', className)}>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('auth.signIn.title', 'Welcome back')}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t('auth.signIn.subtitle', 'Sign in to continue to Vocaid')}
          </p>
        </div>

        {/* OAuth Buttons */}
        <FirstPartyAuthButtons
          onGoogleClick={handleGoogleSignIn}
          onLinkedInClick={handleLinkedInSignIn}
          onXClick={handleXSignIn}
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

        {/* Sign-In Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthInput
            label={t('auth.fields.email', 'Email address')}
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={errors.email}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isLoading}
          />

          <AuthInput
            label={t('auth.fields.password', 'Password')}
            type="password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            error={errors.password}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={isLoading}
          />

          {/* Forgot Password Link */}
          <div className="flex justify-end">
            <Link
              to="/auth/forgot-password"
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {t('auth.signIn.forgotPassword', 'Forgot password?')}
            </Link>
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
                {t('auth.signIn.signingIn', 'Signing in...')}
              </>
            ) : (
              t('auth.signIn.submit', 'Sign in')
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          {t('auth.signIn.noAccount', "Don't have an account?")}{' '}
          <Link
            to="/sign-up"
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {t('auth.signIn.signUp', 'Sign up')}
          </Link>
        </p>

        {/* Legal Notice */}
        <AuthLegalNotice className="mt-6" />
      </motion.div>
    </AnimatePresence>
  );
};

export default FirstPartySignIn;
