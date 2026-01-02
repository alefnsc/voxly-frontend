/**
 * Consent Page
 * 
 * Mandatory consent capture for new users.
 * Collects Terms of Use, Privacy Policy acceptance, and communication preferences.
 * 
 * Design: Uses AuthShell for consistent styling with SignIn/SignUp pages
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import apiService, { ConsentRequirements } from 'services/APIService';
import { clearConsentCache } from 'components/auth/ConsentGuard';
import { AuthShell } from 'components/auth';

type ConsentSource = 'FORM' | 'OAUTH';

export default function ConsentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { t } = useTranslation();

  // State
  const [step, setStep] = useState<1 | 2>(1);
  const [requirements, setRequirements] = useState<ConsentRequirements | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Consent checkboxes
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  // Determine source from location state or user metadata
  const source: ConsentSource = (location.state as any)?.source || 
    (user?.externalAccounts?.length ? 'OAUTH' : 'FORM');

  // Fetch consent requirements on mount
  useEffect(() => {
    const fetchRequirements = async () => {
      try {
        const reqs = await apiService.getConsentRequirements();
        setRequirements(reqs);
      } catch (err) {
        console.error('Failed to fetch consent requirements:', err);
        setError(t('consent.loadError'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequirements();
  }, [t]);

  // Redirect if user already has consent
  useEffect(() => {
    const checkExistingConsent = async () => {
      if (!isLoaded || !user?.id) return;

      try {
        const status = await apiService.getConsentStatus(user.id);
        if (status.hasRequiredConsents && !status.needsReConsent) {
          // User already has consent, redirect to dashboard
          const returnTo = (location.state as any)?.returnTo || '/app/b2c/dashboard';
          navigate(returnTo, { replace: true });
        }
      } catch (err) {
        // User might not exist in DB yet, that's okay
        console.log('Could not check consent status, proceeding with form');
      }
    };

    checkExistingConsent();
  }, [isLoaded, user?.id, navigate, location.state]);

  // Handle "Maybe Later" - sign out and return to landing page
  const handleMaybeLater = async () => {
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Failed to sign out:', err);
      navigate('/', { replace: true });
    }
  };

  // Handle step 1 submission (Terms + Privacy)
  const handleStep1Continue = () => {
    if (!acceptTerms || !acceptPrivacy) {
      setError(t('consent.mustAcceptBoth'));
      return;
    }
    setError(null);
    setStep(2);
  };

  // Handle final submission
  const handleSubmit = async () => {
    if (!user?.id) {
      setError(t('consent.userNotAuth'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await apiService.submitConsent(user.id, {
        acceptTerms,
        acceptPrivacy,
        marketingOptIn,
        source,
      });

      if (result.hasRequiredConsents) {
        // Clear the consent cache so ConsentGuard picks up new status
        clearConsentCache();
        
        // Success - redirect to intended destination
        const returnTo = (location.state as any)?.returnTo || '/app/b2c/dashboard';
        navigate(returnTo, { replace: true });
      } else {
        setError(t('consent.recordFailed'));
      }
    } catch (err) {
      console.error('Failed to submit consent:', err);
      setError(t('consent.genericError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading || !isLoaded) {
    return (
      <AuthShell>
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-zinc-500">{t('consent.loading')}</div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div
          className={`w-2 h-2 rounded-full ${
            step >= 1 ? 'bg-purple-600' : 'bg-zinc-200'
          }`}
        />
        <div className="w-8 h-0.5 bg-zinc-200">
          <div
            className={`h-full transition-all ${
              step >= 2 ? 'w-full bg-purple-600' : 'w-0'
            }`}
          />
        </div>
        <div
          className={`w-2 h-2 rounded-full ${
            step >= 2 ? 'bg-purple-600' : 'bg-zinc-200'
          }`}
        />
      </div>

      {/* Step 1: Terms & Privacy */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <h1 className="text-2xl font-bold text-black text-center mb-2">
            {t('consent.step1.title')}
          </h1>
          <p className="text-zinc-500 text-center mb-8">
            {t('consent.step1.subtitle')}
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-3 bg-zinc-100 border border-zinc-300 rounded-lg text-sm text-zinc-700">
              {error}
            </div>
          )}

          {/* Terms checkbox */}
          <label className="flex items-start gap-3 p-4 rounded-lg border border-zinc-200 hover:border-zinc-300 transition-colors cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded border-zinc-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <span className="text-sm text-zinc-700">
              {t('consent.step1.agreeToTerms')}{' '}
              <a
                href={requirements?.urls.termsOfUse || '/terms-of-use'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-700 underline"
                onClick={(e) => e.stopPropagation()}
              >
                {t('consent.step1.termsOfUse')}
              </a>{' '}
              <span className="text-zinc-400">
                (v{requirements?.versions.terms || '2025-12-23'})
              </span>
            </span>
          </label>

          {/* Privacy checkbox */}
          <label className="flex items-start gap-3 p-4 rounded-lg border border-zinc-200 hover:border-zinc-300 transition-colors cursor-pointer mb-6">
            <input
              type="checkbox"
              checked={acceptPrivacy}
              onChange={(e) => setAcceptPrivacy(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded border-zinc-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <span className="text-sm text-zinc-700">
              {t('consent.step1.agreeToTerms')}{' '}
              <a
                href={requirements?.urls.privacyPolicy || '/privacy-policy'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-700 underline"
                onClick={(e) => e.stopPropagation()}
              >
                {t('consent.step1.privacyPolicy')}
              </a>{' '}
              <span className="text-zinc-400">
                (v{requirements?.versions.privacy || '2025-12-23'})
              </span>
            </span>
          </label>

          {/* Continue button */}
          <button
            onClick={handleStep1Continue}
            disabled={!acceptTerms || !acceptPrivacy}
            className="w-full py-3 px-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors"
          >
            {t('consent.step1.continue')}
          </button>

          {/* Maybe Later link */}
          <div className="mt-6 text-center">
            <button
              onClick={handleMaybeLater}
              className="text-sm text-zinc-500 hover:text-zinc-700 underline transition-colors"
            >
              {t('consent.step1.maybeLater')}
            </button>
            <p className="text-xs text-zinc-400 mt-1">
              {t('consent.step1.declineNote')}
            </p>
          </div>
        </motion.div>
      )}

      {/* Step 2: Communication Preferences */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <h1 className="text-2xl font-bold text-black text-center mb-2">
            {t('consent.step2.title')}
          </h1>
          <p className="text-zinc-500 text-center mb-8">
            {t('consent.step2.subtitle')}
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-3 bg-zinc-100 border border-zinc-300 rounded-lg text-sm text-zinc-700">
              {error}
            </div>
          )}

          {/* Transactional notice (non-optional) */}
          <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded border-2 border-purple-600 bg-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-800">
                  {t('consent.step2.essential.title')}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {t('consent.step2.essential.description')}
                </p>
              </div>
            </div>
          </div>

          {/* Marketing opt-in */}
          <label className="flex items-start gap-3 p-4 rounded-lg border border-zinc-200 hover:border-zinc-300 transition-colors cursor-pointer mb-8">
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded border-zinc-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <div>
              <p className="text-sm font-medium text-zinc-800">
                {t('consent.step2.marketing.title')}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {t('consent.step2.marketing.description')}
              </p>
            </div>
          </label>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 px-4 bg-white text-zinc-700 font-medium rounded-lg border border-zinc-300 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:ring-offset-2 transition-colors"
            >
              {t('consent.step2.back')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? t('consent.step2.saving') : t('consent.step2.getStarted')}
            </button>
          </div>
        </motion.div>
      )}
    </AuthShell>
  );
}
