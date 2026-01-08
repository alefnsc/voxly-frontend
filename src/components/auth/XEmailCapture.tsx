/**
 * X Email Capture Component
 * 
 * Shown when X OAuth doesn't provide email.
 * Collects and verifies user email before completing X account linking.
 * 
 * @module components/auth/XEmailCapture
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from 'lib/utils';
import { AuthInput } from './AuthInput';
import { useAuth } from 'contexts/AuthContext';

// Animation variants
const fadeVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

interface XEmailCaptureProps {
  xPendingId: string;
  className?: string;
}

type CaptureStep = 'loading' | 'email' | 'verification' | 'complete' | 'error';

export const XEmailCapture: React.FC<XEmailCaptureProps> = ({
  xPendingId,
  className,
}) => {
  const { getXPendingInfo, requestXEmailVerification, verifyXEmail } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  // State
  const [step, setStep] = useState<CaptureStep>('loading');
  const [xUserInfo, setXUserInfo] = useState<{ username: string; name: string; pictureUrl?: string } | null>(null);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  // Load X pending info on mount
  useEffect(() => {
    const loadPendingInfo = async () => {
      const result = await getXPendingInfo(xPendingId);
      
      if (result.success && result.data) {
        setXUserInfo(result.data);
        setStep('email');
      } else {
        setError(result.error || 'X sign-in session expired. Please try again.');
        setStep('error');
      }
    };

    loadPendingInfo();
  }, [xPendingId, getXPendingInfo]);

  // Handle email submission
  const handleEmailSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await requestXEmailVerification(xPendingId, email);

    if (result.success) {
      setStep('verification');
    } else {
      setError(result.error || 'Failed to send verification email.');
    }

    setIsLoading(false);
  }, [email, xPendingId, requestXEmailVerification]);

  // Handle verification code submission
  const handleVerifyCode = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const code = verificationCode.trim();
    if (!/^\d{6}$/.test(code)) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await verifyXEmail(xPendingId, email, code);

    if (result.success) {
      setStep('complete');
      
      // Navigate to post-login or dashboard
      setTimeout(() => {
        navigate(result.returnTo || '/auth/post-login', { replace: true });
      }, 1000);
    } else {
      setError(result.error || 'Verification failed. Please try again.');
    }

    setIsLoading(false);
  }, [verificationCode, xPendingId, email, verifyXEmail, navigate]);

  // Handle resend verification
  const handleResend = useCallback(async () => {
    setIsLoading(true);
    setResendMessage(null);
    setError(null);

    const result = await requestXEmailVerification(xPendingId, email);

    if (result.success) {
      setResendMessage('Verification code sent! Check your inbox.');
    } else {
      setError(result.error || 'Failed to resend code.');
    }

    setIsLoading(false);
  }, [xPendingId, email, requestXEmailVerification]);

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
  // RENDER: LOADING
  // ========================================
  if (step === 'loading') {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8', className)}>
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  // ========================================
  // RENDER: ERROR
  // ========================================
  if (step === 'error') {
    return (
      <motion.div
        {...animationProps}
        className={cn('flex flex-col items-center justify-center py-8', className)}
      >
        <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
          <svg
            className="h-8 w-8 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t('auth.xEmail.errorTitle', 'Something went wrong')}
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
          {error}
        </p>
        <button
          onClick={() => navigate('/sign-in', { replace: true })}
          className="mt-6 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
        >
          {t('auth.xEmail.backToSignIn', 'Back to sign in')}
        </button>
      </motion.div>
    );
  }

  // ========================================
  // RENDER: COMPLETE
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
          {t('auth.xEmail.successTitle', 'X account linked!')}
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {t('auth.xEmail.redirecting', 'Redirecting...')}
        </p>
      </motion.div>
    );
  }

  // ========================================
  // RENDER: VERIFICATION CODE
  // ========================================
  if (step === 'verification') {
    return (
      <motion.div
        {...animationProps}
        className={cn('flex flex-col items-center justify-center py-8', className)}
      >
        <div className="h-16 w-16 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-4">
          <svg
            className="h-8 w-8 text-purple-600 dark:text-purple-400"
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
          <strong>{email}</strong>
        </p>

        <form onSubmit={handleVerifyCode} className="mt-6 w-full max-w-sm space-y-3">
          <AuthInput
            label={t('auth.verification.codeLabel', 'Verification code')}
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder={t('auth.verification.codePlaceholder', '6-digit code')}
            autoComplete="one-time-code"
            disabled={isLoading}
            required
          />
          
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              'w-full px-4 py-2 text-sm font-medium rounded-lg',
              'bg-zinc-900 text-white hover:bg-zinc-800 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isLoading
              ? t('auth.verification.verifying', 'Verifying...')
              : t('auth.verification.verify', 'Verify')}
          </button>
        </form>
        
        <button
          onClick={handleResend}
          disabled={isLoading}
          className={cn(
            'mt-6 px-4 py-2 text-sm font-medium rounded-lg',
            'text-primary hover:bg-primary/10 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {t('auth.verification.resend', 'Resend verification email')}
        </button>
        
        {resendMessage && (
          <p className="mt-2 text-sm text-green-600 dark:text-green-400">{resendMessage}</p>
        )}
      </motion.div>
    );
  }

  // ========================================
  // RENDER: EMAIL CAPTURE
  // ========================================
  return (
    <motion.div
      {...animationProps}
      className={cn('flex flex-col items-center py-8', className)}
    >
      {/* X User Info */}
      <div className="flex flex-col items-center mb-6">
        {xUserInfo?.pictureUrl ? (
          <img
            src={xUserInfo.pictureUrl}
            alt={xUserInfo.name}
            className="w-16 h-16 rounded-full mb-3"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-3">
            <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </div>
        )}
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t('auth.xEmail.title', 'Almost there!')}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('auth.xEmail.subtitle', 'Signing in as')} <strong>@{xUserInfo?.username}</strong>
        </p>
      </div>

      {/* Email Form */}
      <div className="w-full max-w-sm">
        <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-4">
          {t('auth.xEmail.description', "X didn't share your email. Please enter it below to complete sign-in.")}
        </p>

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <AuthInput
            label={t('auth.fields.email', 'Email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isLoading}
            required
          />
          
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              'w-full px-4 py-2 text-sm font-medium rounded-lg',
              'bg-zinc-900 text-white hover:bg-zinc-800 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isLoading
              ? t('auth.xEmail.sending', 'Sending code...')
              : t('auth.xEmail.sendCode', 'Send verification code')}
          </button>
        </form>
        
        <button
          onClick={() => navigate('/sign-in', { replace: true })}
          className="mt-6 w-full px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          {t('auth.xEmail.cancel', 'Cancel and try another method')}
        </button>
      </div>
    </motion.div>
  );
};

export default XEmailCapture;
