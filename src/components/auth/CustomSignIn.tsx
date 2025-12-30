/**
 * Custom Sign-In Component
 * 
 * Headless Clerk sign-in form with Vocaid premium styling.
 * Uses useSignIn hook for complete control over the UI.
 * 
 * @module components/auth/CustomSignIn
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useSignIn } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from 'lib/utils';
import { signInSchema, SignInFormData } from './validation';
import { AuthInput } from './AuthInput';
import { AuthButtons, AuthDivider } from './AuthButtons';
import { AuthLegalNotice } from './AuthLegalNotice';
import { B2C_ROUTES } from 'routes/b2cRoutes';

// Form step types
type SignInStep = 'form' | 'factor' | 'complete';

// Animation variants for form transitions
const fadeVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

interface CustomSignInProps {
  onSuccess?: () => void;
  className?: string;
}

export const CustomSignIn: React.FC<CustomSignInProps> = ({
  onSuccess,
  className,
}) => {
  const { signIn, isLoaded, setActive } = useSignIn();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  // Form state
  const [step, setStep] = useState<SignInStep>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  
  // Form values
  const [formData, setFormData] = useState<SignInFormData>({
    email: '',
    password: '',
  });
  
  // Second factor (if needed)
  const [secondFactorCode, setSecondFactorCode] = useState('');
  const [secondFactorError, setSecondFactorError] = useState<string | null>(null);
  
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
    
    if (!isLoaded || !signIn) return;
    if (!validateForm()) return;
    
    setIsLoading(true);
    setGlobalError(null);

    try {
      // Attempt sign-in
      const result = await signIn.create({
        identifier: formData.email,
        password: formData.password,
      });

      if (result.status === 'complete') {
        // Sign-in successful
        await setActive({ session: result.createdSessionId });
        setStep('complete');
        onSuccess?.();
        
        // Navigate to dashboard
        setTimeout(() => {
          navigate(B2C_ROUTES.DASHBOARD);
        }, 1000);
      } else if (result.status === 'needs_second_factor') {
        // 2FA required
        setStep('factor');
      } else {
        console.error('Unexpected sign-in status:', result);
        setGlobalError(t('auth.errors.unexpected', 'An unexpected error occurred. Please try again.'));
      }
    } catch (error: any) {
      console.error('Sign-in error:', error);
      const errorMessage = error.errors?.[0]?.longMessage || 
                          error.errors?.[0]?.message || 
                          t('auth.errors.invalidCredentials', 'Invalid email or password. Please try again.');
      setGlobalError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle second factor verification
  const handleSecondFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded || !signIn) return;
    
    setIsLoading(true);
    setSecondFactorError(null);

    try {
      const result = await signIn.attemptSecondFactor({
        strategy: 'totp',
        code: secondFactorCode,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        setStep('complete');
        onSuccess?.();
        
        setTimeout(() => {
          navigate(B2C_ROUTES.DASHBOARD);
        }, 1000);
      } else {
        console.error('2FA incomplete:', result);
        setSecondFactorError(t('auth.errors.verificationFailed', 'Verification failed. Please try again.'));
      }
    } catch (error: any) {
      console.error('2FA error:', error);
      const errorMessage = error.errors?.[0]?.longMessage || 
                          error.errors?.[0]?.message || 
                          t('auth.errors.invalidCode', 'Invalid verification code. Please try again.');
      setSecondFactorError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!isLoaded || !signIn) return;
    
    if (!formData.email) {
      setErrors({ email: t('auth.errors.emailFirst', 'Please enter your email first') });
      return;
    }
    
    setIsLoading(true);
    setGlobalError(null);

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: formData.email,
      });
      
      navigate(`/forgot-password?email=${encodeURIComponent(formData.email)}`);
    } catch (error: any) {
      console.error('Forgot password error:', error);
      const errorMessage = error.errors?.[0]?.longMessage || 
                          error.errors?.[0]?.message || 
                          t('auth.errors.resetFailed', 'Failed to send reset email. Please try again.');
      setGlobalError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <AnimatePresence mode="wait">
        {/* Sign-In Form Step */}
        {step === 'form' && (
          <motion.div
            key="form"
            variants={fadeVariants}
            initial={prefersReducedMotion ? false : 'initial'}
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-2">
                {t('auth.signIn.title', 'Welcome back')}
              </h1>
              <p className="text-sm text-zinc-500">
                {t('auth.signIn.subtitle', 'Sign in to continue your interview practice')}
              </p>
            </div>

            {/* OAuth Buttons */}
            <AuthButtons 
              mode="signIn" 
              onError={setGlobalError}
            />

            <AuthDivider />

            {/* Global Error */}
            {globalError && (
              <div className="mb-4 p-3 bg-zinc-50 border-l-4 border-black rounded-r">
                <p className="text-sm text-zinc-700">{globalError}</p>
              </div>
            )}

            {/* Sign-In Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <AuthInput
                label={t('auth.email', 'Email')}
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={errors.email}
                placeholder="john@example.com"
                autoComplete="email"
                required
              />

              {/* Password */}
              <AuthInput
                label={t('auth.password', 'Password')}
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                error={errors.password}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-zinc-500 hover:text-purple-600 transition-colors focus:outline-none focus:text-purple-600"
                >
                  {t('auth.forgotPassword', 'Forgot password?')}
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  'w-full py-3 px-4 min-h-[44px] rounded-lg text-sm font-semibold',
                  'bg-purple-600 text-white',
                  'transition-all duration-200',
                  'hover:bg-purple-700',
                  'focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('auth.signingIn', 'Signing in...')}
                  </span>
                ) : (
                  t('auth.signIn.button', 'Sign In')
                )}
              </button>
            </form>

            {/* Divider before legal */}
            <div className="border-t border-zinc-200 my-6" />

            {/* Legal Notice */}
            <AuthLegalNotice className="mb-6" />

            {/* Sign Up Link */}
            <p className="text-center text-sm text-zinc-500">
              {t('auth.noAccount', "Don't have an account?")}{' '}
              <Link 
                to="/sign-up" 
                className="font-semibold text-purple-600 hover:text-purple-700 transition-colors focus:outline-none focus:underline"
              >
                {t('auth.signUp.link', 'Sign up')}
              </Link>
            </p>
          </motion.div>
        )}

        {/* Second Factor Step */}
        {step === 'factor' && (
          <motion.div
            key="factor"
            variants={fadeVariants}
            initial={prefersReducedMotion ? false : 'initial'}
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-2">
                {t('auth.twoFactor.title', 'Two-Factor Authentication')}
              </h1>
              <p className="text-sm text-zinc-500">
                {t('auth.twoFactor.subtitle', 'Enter the code from your authenticator app')}
              </p>
            </div>

            {/* 2FA Error */}
            {secondFactorError && (
              <div className="mb-4 p-3 bg-zinc-50 border-l-4 border-black rounded-r">
                <p className="text-sm text-zinc-700">{secondFactorError}</p>
              </div>
            )}

            <form onSubmit={handleSecondFactor} className="space-y-4">
              <AuthInput
                label={t('auth.twoFactor.code', 'Verification Code')}
                value={secondFactorCode}
                onChange={(e) => {
                  setSecondFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setSecondFactorError(null);
                }}
                placeholder="000000"
                maxLength={6}
                autoComplete="one-time-code"
                className="text-center text-lg tracking-widest"
              />

              <button
                type="submit"
                disabled={isLoading || secondFactorCode.length !== 6}
                className={cn(
                  'w-full py-3 px-4 min-h-[44px] rounded-lg text-sm font-semibold',
                  'bg-purple-600 text-white',
                  'transition-all duration-200',
                  'hover:bg-purple-700',
                  'focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('auth.verifying', 'Verifying...')}
                  </span>
                ) : (
                  t('auth.twoFactor.button', 'Verify')
                )}
              </button>
            </form>

            {/* Back Button */}
            <button
              type="button"
              onClick={() => setStep('form')}
              className="mt-6 w-full text-center text-sm text-zinc-500 hover:text-zinc-700 transition-colors focus:outline-none focus:text-purple-600"
            >
              ← {t('auth.backToSignIn', 'Back to sign in')}
            </button>
          </motion.div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <motion.div
            key="complete"
            variants={fadeVariants}
            initial={prefersReducedMotion ? false : 'initial'}
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-2">
                {t('auth.signIn.success', 'Welcome back!')}
              </h2>
              <p className="text-sm text-zinc-500">
                {t('auth.signIn.redirecting', 'Redirecting to your dashboard...')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomSignIn;
