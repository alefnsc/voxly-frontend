/**
 * Onboarding Account Type Page
 *
 * Captures account type selection (Personal vs Business).
 * Business is disabled for now.
 * This step must appear before password setup and consent for all users (incl. OAuth/SSO).
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { User as UserIcon, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import apiService from '../../../services/APIService';
import { AuthShell } from '../../../components/auth';

export default function OnboardingAccountTypePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoaded, isSignedIn, refreshSession } = useAuth();

  const [selected, setSelected] = useState<'PERSONAL' | 'BUSINESS'>('PERSONAL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const returnTo = useMemo(() => {
    return (location.state as any)?.returnTo || '/app/b2c/dashboard';
  }, [location.state]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      navigate('/sign-in', { replace: true });
      return;
    }

    if (user.accountTypeConfirmedAt) {
      if (user.hasPassword === false) {
        navigate('/onboarding/password', { replace: true, state: { returnTo } });
        return;
      }

      navigate('/onboarding/consent', { replace: true, state: { returnTo } });
    }
  }, [isLoaded, isSignedIn, user, navigate, returnTo]);

  const handleContinue = async () => {
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      await apiService.updateUserProfile(user.id, {
        accountTypeConfirmed: true,
      });

      await refreshSession();

      if (user.hasPassword === false) {
        navigate('/onboarding/password', { replace: true, state: { returnTo } });
        return;
      }

      navigate('/onboarding/consent', { replace: true, state: { returnTo } });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <AuthShell>
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </AuthShell>
    );
  }

  if (!isSignedIn || !user) {
    return (
      <AuthShell>
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-zinc-500">{t('common.redirecting', 'Redirecting...')}</div>
        </div>
      </AuthShell>
    );
  }

  if (user.accountTypeConfirmedAt) {
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
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-3 h-3 rounded-full bg-purple-600" />
          <div className="w-8 h-0.5 bg-zinc-200" />
          <div className="w-3 h-3 rounded-full bg-zinc-200" />
          <div className="w-8 h-0.5 bg-zinc-200" />
          <div className="w-3 h-3 rounded-full bg-zinc-200" />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <UserIcon className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">
            {t('auth.fields.accountType', 'Account Type')}
          </h1>
          <p className="text-zinc-600">
            {t('onboarding.accountType.subtitle', 'Choose the account type that best matches how you’ll use Vocaid.')}
          </p>
        </div>

        <fieldset className="mb-6">
          <legend className="sr-only">{t('auth.fields.accountType', 'Account Type')}</legend>
          <div className="flex gap-4">
            {/* Personal option */}
            <label
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                selected === 'PERSONAL'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-1 ring-purple-500'
                  : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <input
                type="radio"
                name="userType"
                value="PERSONAL"
                checked={selected === 'PERSONAL'}
                onChange={() => setSelected('PERSONAL')}
                disabled={isSubmitting}
                className="sr-only"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {t('auth.accountType.personal', 'Personal')}
              </span>
            </label>

            {/* Business option (disabled) */}
            <label
              title={t('auth.accountType.businessComingSoon', 'Business accounts coming soon')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/50 opacity-60 cursor-not-allowed"
            >
              <input
                type="radio"
                name="userType"
                value="BUSINESS"
                checked={selected === 'BUSINESS'}
                disabled
                className="sr-only"
              />
              <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
                {t('auth.accountType.business', 'Business')}
              </span>
              <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">
                {t('common.soon', 'Soon')}
              </span>
            </label>
          </div>
        </fieldset>

        <button
          type="button"
          onClick={handleContinue}
          disabled={isSubmitting || selected !== 'PERSONAL'}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? t('common.loading', 'Loading...') : t('common.continue', 'Continue')}
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="mt-8 pt-6 border-t border-zinc-200">
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
            <span>{t('onboarding.step', 'Step')} 1 {t('onboarding.of', 'of')} 3</span>
            <ArrowRight className="w-4 h-4" />
            <span className="text-zinc-400">
              {user.hasPassword === false
                ? t('onboarding.nextPassword', 'Set password')
                : t('onboarding.nextConsent', 'Terms & Privacy')}
            </span>
          </div>
        </div>
      </motion.div>
    </AuthShell>
  );
}
