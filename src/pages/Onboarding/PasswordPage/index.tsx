/**
 * Onboarding Password Page
 * 
 * First step of onboarding for users without a password (OAuth signups).
 * Users must set a password before proceeding to consent.
 * 
 * @module pages/Onboarding/PasswordPage
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { SetPasswordForm } from '../../../components/auth';
import { AuthShell } from '../../../components/auth';

export default function OnboardingPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isLoaded, isSignedIn, refreshSession } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Redirect logic based on auth state
  useEffect(() => {
    if (!isLoaded) return;

    // Not signed in - go to sign-in
    if (!isSignedIn || !user) {
      navigate('/sign-in', { replace: true });
      return;
    }

    // Account type must be confirmed before password step
    if (!user.accountTypeConfirmedAt) {
      navigate('/onboarding/account-type', {
        replace: true,
        state: { returnTo: '/onboarding/password' },
      });
      return;
    }

    // Only OAuth/SSO users without a password should stay on this page
    if (user.hasPassword !== false) {
      navigate('/onboarding/consent', { replace: true });
      return;
    }
  }, [isLoaded, isSignedIn, user, navigate]);

  const handlePasswordSet = async () => {
    setIsRedirecting(true);
    // Refresh session to get updated hasPassword
    await refreshSession();
    // Navigate to consent step
    navigate('/onboarding/consent', { replace: true });
  };

  // Show loading while checking auth
  if (!isLoaded || isRedirecting) {
    return (
      <AuthShell>
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </AuthShell>
    );
  }

  // Not signed in or doesn't need password - will redirect
  if (!isSignedIn || !user || !user.accountTypeConfirmedAt || user.hasPassword !== false) {
    return (
      <AuthShell>
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-zinc-500">{t('common.redirecting', 'Redirecting...')}</div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md mx-auto"
      >
        {/* Progress indicator - 3 steps: account-type (done) → password (current) → consent */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-3 h-3 rounded-full bg-purple-600" />
          <div className="w-8 h-0.5 bg-purple-600" />
          <div className="w-3 h-3 rounded-full bg-purple-600" />
          <div className="w-8 h-0.5 bg-zinc-200" />
          <div className="w-3 h-3 rounded-full bg-zinc-200" />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <Lock className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">
            {t('auth.setPassword.title', 'Set Your Password')}
          </h1>
          <p className="text-zinc-600">
            {t('auth.setPassword.onboardingSubtitle', 'Create a password for your account. This allows you to sign in with email and password in the future.')}
          </p>
        </div>

        {/* Security notice */}
        {/* <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-100 rounded-lg mb-6">
          <Shield className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-purple-800">
            <p className="font-medium mb-1">
              {t('auth.setPassword.securityTitle', 'Why set a password?')}
            </p>
            <p className="text-purple-700">
              {t('auth.setPassword.securityReason', 'Having a password gives you more ways to sign in and helps secure your account.')}
            </p>
          </div>
        </div> */}

        {/* Password form */}
        <SetPasswordForm
          userId={user.id}
          onSuccess={handlePasswordSet}
        />

        {/* Step indicator - Password is step 2 of 3 (account-type → password → consent) */}
        <div className="mt-8 pt-6 border-t border-zinc-200">
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
            <span>{t('onboarding.step', 'Step')} 2 {t('onboarding.of', 'of')} 3</span>
            <ArrowRight className="w-4 h-4" />
            <span className="text-zinc-400">{t('onboarding.nextConsent', 'Terms & Privacy')}</span>
          </div>
        </div>
      </motion.div>
    </AuthShell>
  );
}
