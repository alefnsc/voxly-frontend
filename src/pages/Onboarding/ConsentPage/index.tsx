/**
 * Consent Page
 * 
 * Mandatory consent capture for new users.
 * Collects Terms of Use, Privacy Policy acceptance, and communication preferences.
 * Step 3: Optional phone verification to redeem free trial credits.
 * 
 * Design: Uses AuthShell for consistent styling with SignIn/SignUp pages
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser, useAuth } from 'contexts/AuthContext';
import { useUserContext } from 'contexts/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Phone, 
  ChevronRight, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Search
} from 'lucide-react';
import apiService, { ConsentRequirements } from 'services/APIService';
import { clearConsentCache } from 'components/auth/ConsentGuard';
import { AuthShell } from 'components/auth';
import { useLanguage } from 'hooks/use-language';
import { parseReturnTo, ONBOARDING_ROUTES } from 'lib/onboarding';
import {
  CountryCode,
  getAllCountriesWithCallingCodes,
  getCountryDisplayName,
  getDefaultCountry,
  formatAsYouType,
  validatePhone,
  normalizeToE164,
  getPlaceholder,
  CountryOption,
} from 'lib/phone';

type ConsentSource = 'FORM' | 'OAUTH';
type PhoneStep = 'prompt' | 'phone' | 'code' | 'success';

export default function ConsentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  const { invalidateCache: invalidateUserCache } = useUserContext();
  const { t, i18n } = useTranslation();
  const { preferredPhoneCountry, detectedCountry, setPreferredPhoneCountry } = useLanguage();

  // Account type must be confirmed before consent
  useEffect(() => {
    if (!isLoaded) return;
    if (!user?.id) return;

    if (!user.accountTypeConfirmedAt) {
      navigate('/onboarding/account-type', {
        replace: true,
        state: {
          returnTo: location.pathname + location.search,
        },
      });
    }
  }, [isLoaded, user?.id, user?.accountTypeConfirmedAt, navigate, location.pathname, location.search]);

  // State - Steps: 1=Terms, 2=Marketing, 3=Phone (password step removed, now handled in PasswordPage)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [requirements, setRequirements] = useState<ConsentRequirements | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Consent checkboxes
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  // Phone verification state (step 3)
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('prompt');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isPhoneLoading, setIsPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  
  // Skip phone state (for loading/retry UX)
  const [isSkipping, setIsSkipping] = useState(false);
  const [skipError, setSkipError] = useState<string | null>(null);
  
  // Country selector state
  const [selectedCountry, setSelectedCountry] = useState<string>(() => 
    getDefaultCountry(preferredPhoneCountry, detectedCountry)
  );
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const countrySearchRef = useRef<HTMLInputElement>(null);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Get all countries
  const allCountries = useMemo(
    () => getAllCountriesWithCallingCodes(i18n.language),
    [i18n.language]
  );
  
  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return allCountries;
    const search = countrySearch.toLowerCase();
    return allCountries.filter(c => {
      const displayName = getCountryDisplayName(i18n.language, c.iso2).toLowerCase();
      return displayName.includes(search) || c.iso2.toLowerCase().includes(search) || `+${c.dialCode}`.includes(search);
    });
  }, [allCountries, countrySearch, i18n.language]);
  
  // Get selected country info
  const selectedCountryInfo = useMemo(() => 
    allCountries.find(c => c.iso2 === selectedCountry) || allCountries[0],
  [allCountries, selectedCountry]);

  // Determine source from location state or user metadata
  const source: ConsentSource = (location.state as any)?.source || 
    (user?.authProviders?.includes('google') ? 'OAUTH' : 'FORM');

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
        const status = await apiService.getConsentStatus();
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

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
        setCountrySearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (isCountryDropdownOpen && countrySearchRef.current) {
      countrySearchRef.current.focus();
    }
  }, [isCountryDropdownOpen]);

  // Focus first code input when entering code step
  useEffect(() => {
    if (phoneStep === 'code' && codeInputRefs.current[0]) {
      codeInputRefs.current[0]?.focus();
    }
  }, [phoneStep]);

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

  // Handle step 2 submission (Marketing) - submit consent, then check for password/phone steps
  const handleStep2Submit = async () => {
    if (!user?.id) {
      setError(t('consent.userNotAuth'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await apiService.submitConsent({
        acceptTerms,
        acceptPrivacy,
        marketingOptIn,
        source,
      });

      if (result.hasRequiredConsents) {
        // Clear the consent cache so ConsentGuard picks up new status
        clearConsentCache();
        
        // Password is now handled in /onboarding/password before consent
        // So we proceed directly to phone verification step
        
        // Check phone status before showing phone step
        try {
          const status = await apiService.getPhoneStatus();
          
          if (status.isVerified) {
            // Already verified, skip to dashboard
            const returnTo = (location.state as any)?.returnTo || '/app/b2c/dashboard';
            navigate(returnTo, { replace: true });
            return;
          }
        } catch (err) {
          console.log('Could not fetch phone status, proceeding to phone step');
        }
        
        // Go to phone verification step (step 3)
        setStep(3);
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

  // Handle skip phone verification
  // Consent was already stored in step 2 - just record skip preference and navigate
  const handleSkipPhone = async () => {
    // Parse returnTo using centralized helper
    const returnTo = parseReturnTo(location.state);
    
    if (!user?.id) {
      // Fallback navigation if no user
      console.log('🔀 [Onboarding] Skip phone: no user, redirecting to', returnTo);
      navigate(returnTo, { replace: true });
      return;
    }

    setIsSkipping(true);
    setSkipError(null);

    try {
      console.log('🔀 [Onboarding] Skip phone: calling API');
      
      // Record skip preference via backend API
      const result = await apiService.skipPhoneForCredits();
      if (!result.success) {
        console.warn('🔀 [Onboarding] Skip phone: API failed', result.error);
        setSkipError(result.error || t('consent.step3.skipFailed', 'Something went wrong. Please try again.'));
        setIsSkipping(false);
        return;
      }

      console.log('🔀 [Onboarding] Skip phone: success, clearing caches');
      
      // Clear consent cache so guards refetch fresh status
      clearConsentCache();
      
      // CRITICAL: Invalidate user context cache to prevent "stuck loading"
      // This ensures RequireAuth doesn't block on stale sync state
      invalidateUserCache();

      console.log('🔀 [Onboarding] Skip phone: navigating to', returnTo);
      
      // Navigate to dashboard (or returnTo destination)
      navigate(returnTo, { replace: true });
    } catch (err) {
      console.error('🔀 [Onboarding] Skip phone: exception', err);
      setSkipError(t('consent.step3.skipFailed', 'Something went wrong. Please try again.'));
      setIsSkipping(false);
    }
  };

  // Handle country select
  const handleCountrySelect = useCallback((country: CountryOption) => {
    setSelectedCountry(country.iso2);
    setIsCountryDropdownOpen(false);
    setCountrySearch('');
    setPhoneNumber('');
    setPreferredPhoneCountry(country.iso2).catch(err => {
      console.warn('Failed to persist phone country preference:', err);
    });
  }, [setPreferredPhoneCountry]);

  // Handle phone input change
  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.startsWith('+')) {
      setPhoneNumber(value);
    } else {
      const formatted = formatAsYouType(value, selectedCountry as CountryCode);
      setPhoneNumber(formatted);
    }
    setPhoneError(null);
  }, [selectedCountry]);

  // Handle send OTP
  const handleSendOTP = useCallback(async () => {
    if (!user?.id || !phoneNumber.trim()) return;
    
    setIsPhoneLoading(true);
    setPhoneError(null);
    
    try {
      const validation = validatePhone(phoneNumber, selectedCountry as CountryCode);
      if (!validation.isValid) {
        setPhoneError(validation.error || t('phoneVerification.errors.invalidPhone'));
        setIsPhoneLoading(false);
        return;
      }
      
      const e164Phone = normalizeToE164(phoneNumber, selectedCountry as CountryCode);
      if (!e164Phone) {
        setPhoneError(t('phoneVerification.errors.invalidPhone'));
        setIsPhoneLoading(false);
        return;
      }
      
      setNormalizedPhone(e164Phone);
      
      const result = await apiService.sendPhoneOTP(e164Phone, i18n.language);
      
      if (!result.success) {
        if (result.code === 'PHONE_ALREADY_VERIFIED') {
          setPhoneError(t('phoneVerification.errors.alreadyVerified'));
        } else {
          setPhoneError(result.error || t('phoneVerification.errors.sendFailed'));
        }
        return;
      }
      
      setPhoneStep('code');
      setCountdown(60);
    } catch (err: any) {
      setPhoneError(err.message || t('phoneVerification.errors.sendFailed'));
    } finally {
      setIsPhoneLoading(false);
    }
  }, [user?.id, phoneNumber, selectedCountry, i18n.language, t]);

  // Handle code input change
  const handleCodeChange = useCallback((index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    if (digit && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  }, [code]);

  // Handle code keydown
  const handleCodeKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  }, [code]);

  // Handle verify OTP
  const handleVerifyOTP = useCallback(async () => {
    if (!user?.id) return;
    
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setPhoneError(t('phoneVerification.errors.incompleteCode'));
      return;
    }
    
    setIsPhoneLoading(true);
    setPhoneError(null);
    
    try {
      const result = await apiService.verifyPhoneOTP(normalizedPhone, fullCode);
      
      if (!result.success || !result.verified) {
        setPhoneError(result.error || t('phoneVerification.errors.invalidCode'));
        return;
      }
      
      // Skip flag is cleared automatically by the backend on successful verification
      
      setPhoneStep('success');
      
      // Navigate to dashboard after a brief delay
      setTimeout(() => {
        const returnTo = (location.state as any)?.returnTo || '/app/b2c/dashboard';
        navigate(returnTo, { replace: true });
      }, 2000);
    } catch (err: any) {
      setPhoneError(err.message || t('phoneVerification.errors.verifyFailed'));
    } finally {
      setIsPhoneLoading(false);
    }
  }, [user, normalizedPhone, code, t, navigate, location.state]);

  // Handle resend OTP
  const handleResendOTP = useCallback(async () => {
    if (countdown > 0 || !user?.id) return;
    
    setIsPhoneLoading(true);
    setPhoneError(null);
    
    try {
      const result = await apiService.sendPhoneOTP(normalizedPhone, i18n.language);
      if (!result.success) {
        setPhoneError(result.error || t('phoneVerification.errors.resendFailed'));
        return;
      }
      setCountdown(60);
      setCode(['', '', '', '', '', '']);
    } catch (err: any) {
      setPhoneError(err.message);
    } finally {
      setIsPhoneLoading(false);
    }
  }, [countdown, user?.id, normalizedPhone, i18n.language, t]);

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
      {/* Progress indicator - shows 3 or 4 dots based on whether password step is needed */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {/* Step 1: Terms */}
        <div className={`w-2 h-2 rounded-full ${step >= 1 ? 'bg-purple-600' : 'bg-zinc-200'}`} />
        <div className="w-8 h-0.5 bg-zinc-200">
          <div className={`h-full transition-all ${step >= 2 ? 'w-full bg-purple-600' : 'w-0'}`} />
        </div>
        {/* Step 2: Marketing */}
        <div className={`w-2 h-2 rounded-full ${step >= 2 ? 'bg-purple-600' : 'bg-zinc-200'}`} />
        <div className="w-8 h-0.5 bg-zinc-200">
          <div className={`h-full transition-all ${step >= 3 ? 'w-full bg-purple-600' : 'w-0'}`} />
        </div>
        {/* Step 3: Phone verification */}
        <div className={`w-2 h-2 rounded-full ${step >= 3 ? 'bg-purple-600' : 'bg-zinc-200'}`} />
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Terms & Privacy */}
        {step === 1 && (
          <motion.div
            key="step1"
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
            key="step2"
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
                onClick={handleStep2Submit}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? t('consent.step2.saving') : t('consent.step2.continue', 'Continue')}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Phone Verification for Free Credits */}
        {step === 3 && (
          <motion.div
            key="step-phone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AnimatePresence mode="wait">
              {/* Phone Step: Prompt */}
              {phoneStep === 'prompt' && (
                <motion.div
                  key="phone-prompt"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex items-center justify-center mb-4">
                  </div>
                  <h1 className="text-2xl font-bold text-black text-center mb-2">
                    {t('phoneVerification.cta.title', 'Claim Free Credits')}
                  </h1>
                  <p className="text-zinc-500 text-center mb-8">
                    {t('phoneVerification.cta.description', 'Verify your phone number to receive 5 free interview credits')}
                  </p>

                  <button
                    onClick={() => setPhoneStep('phone')}
                    disabled={isSkipping}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors mb-4 disabled:bg-zinc-300 disabled:cursor-not-allowed"
                  >
                    <Phone className="h-5 w-5" />
                    {t('phoneVerification.cta.button', 'Verify Phone')}
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  <button
                    onClick={handleSkipPhone}
                    disabled={isSkipping}
                    className="w-full py-3 px-4 bg-white text-zinc-600 font-medium rounded-lg border border-zinc-300 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:ring-offset-2 transition-colors disabled:bg-zinc-100 disabled:cursor-not-allowed"
                  >
                    {isSkipping ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                        {t('consent.step3.finishing', 'Finishing...')}
                      </span>
                    ) : (
                      t('consent.step3.skipForNow', 'Skip for now')
                    )}
                  </button>

                  {/* Skip error with retry */}
                  {skipError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600 text-center mb-2">{skipError}</p>
                      {/* <button
                        onClick={handleSkipPhone}
                        className="w-full py-2 px-3 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200 transition-colors"
                      >
                        {t('consent.step3.tryAgain', 'Try again')}
                      </button> */}
                    </div>
                  )}

                  <p className="text-xs text-zinc-400 text-center mt-4">
                    {t('consent.step3.skipNote', 'You can verify later from your dashboard to claim free credits')}
                  </p>
                </motion.div>
              )}

              {/* Phone Step: Enter Phone */}
              {phoneStep === 'phone' && (
                <motion.div
                  key="phone-input"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => setPhoneStep('prompt')}
                      className="p-1 -ml-1 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-xl font-bold text-black">
                      {t('phoneVerification.phone.title', 'Enter Phone Number')}
                    </h1>
                  </div>

                  {phoneError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-600">{phoneError}</p>
                    </div>
                  )}

                  {/* Country selector + Phone input */}
                  <div className="mb-4">
                    <div className="flex gap-2">
                      {/* Country Dropdown */}
                      <div className="relative" ref={countryDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                          className="flex items-center gap-1 px-3 py-3 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors min-w-[100px]"
                        >
                          <span className="text-lg">{selectedCountryInfo.flag}</span>
                          <span className="text-sm text-zinc-600">+{selectedCountryInfo.dialCode}</span>
                          <ChevronDown className="h-4 w-4 text-zinc-400" />
                        </button>
                        
                        {isCountryDropdownOpen && (
                          <div className="absolute z-50 mt-1 w-64 max-h-60 overflow-auto bg-white border border-zinc-200 rounded-lg shadow-lg">
                            <div className="sticky top-0 bg-white p-2 border-b border-zinc-100">
                              <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                <input
                                  ref={countrySearchRef}
                                  type="text"
                                  value={countrySearch}
                                  onChange={(e) => setCountrySearch(e.target.value)}
                                  placeholder={t('phoneVerification.phone.searchCountry', 'Search country...')}
                                  className="w-full pl-8 pr-3 py-2 text-sm border border-zinc-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                />
                              </div>
                            </div>
                            <div className="py-1">
                              {filteredCountries.length === 0 ? (
                                <p className="px-3 py-2 text-sm text-zinc-500">
                                  {t('phoneVerification.phone.noCountries', 'No countries found')}
                                </p>
                              ) : (
                                filteredCountries.map((country) => (
                                  <button
                                    key={country.iso2}
                                    onClick={() => handleCountrySelect(country)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-purple-50 transition-colors ${
                                      country.iso2 === selectedCountry ? 'bg-purple-50' : ''
                                    }`}
                                  >
                                    <span className="text-lg">{country.flag}</span>
                                    <span className="flex-1 text-sm text-zinc-700 truncate">
                                      {getCountryDisplayName(i18n.language, country.iso2)}
                                    </span>
                                    <span className="text-xs text-zinc-400">+{country.dialCode}</span>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Phone Input */}
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        placeholder={getPlaceholder(selectedCountry as CountryCode)}
                        className="flex-1 px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                        autoFocus
                      />
                    </div>
                    <p className="mt-2 text-xs text-zinc-400">
                      {t('phoneVerification.phone.hint', "We'll send a 6-digit code via SMS")}
                    </p>
                  </div>

                  <button
                    onClick={handleSendOTP}
                    disabled={isPhoneLoading || !phoneNumber.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isPhoneLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {t('common.sending', 'Sending...')}
                      </>
                    ) : (
                      <>
                        {t('phoneVerification.phone.send', 'Send Code')}
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </motion.div>
              )}

              {/* Phone Step: Enter Code */}
              {phoneStep === 'code' && (
                <motion.div
                  key="phone-code"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => {
                        setPhoneStep('phone');
                        setCode(['', '', '', '', '', '']);
                        setPhoneError(null);
                      }}
                      className="p-1 -ml-1 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-xl font-bold text-black">
                      {t('phoneVerification.code.title', 'Enter Verification Code')}
                    </h1>
                  </div>

                  <p className="text-sm text-zinc-500 mb-6 text-center">
                    {t('phoneVerification.code.sent', { phone: phoneNumber, defaultValue: 'Code sent to {{phone}}' })}
                  </p>

                  {phoneError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-600">{phoneError}</p>
                    </div>
                  )}

                  {/* OTP Inputs */}
                  <div className="flex justify-center gap-2 mb-6">
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (codeInputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleCodeKeyDown(index, e)}
                        className={`w-12 h-14 text-center text-xl font-semibold border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all ${
                          phoneError ? 'border-red-300 bg-red-50' : 'border-zinc-300'
                        }`}
                        disabled={isPhoneLoading}
                      />
                    ))}
                  </div>

                  {/* Resend button */}
                  <div className="text-center mb-6">
                    {countdown > 0 ? (
                      <p className="text-sm text-zinc-400">
                        {t('phoneVerification.code.resendIn', { seconds: countdown, defaultValue: 'Resend in {{seconds}}s' })}
                      </p>
                    ) : (
                      <button
                        onClick={handleResendOTP}
                        disabled={isPhoneLoading}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        {t('phoneVerification.code.resend', 'Resend Code')}
                      </button>
                    )}
                  </div>

                  <button
                    onClick={handleVerifyOTP}
                    disabled={isPhoneLoading || code.join('').length !== 6}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isPhoneLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {t('common.verifying', 'Verifying...')}
                      </>
                    ) : (
                      t('phoneVerification.code.verify', 'Verify')
                    )}
                  </button>
                </motion.div>
              )}

              {/* Phone Step: Success */}
              {phoneStep === 'success' && (
                <motion.div
                  key="phone-success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8"
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-4 bg-purple-100 rounded-full">
                      <CheckCircle2 className="h-10 w-10 text-purple-600" />
                    </div>
                  </div>
                  <h1 className="text-2xl font-bold text-black mb-2">
                    {t('phoneVerification.success.title', 'Phone Verified!')}
                  </h1>
                  <p className="text-zinc-500">
                    {t('phoneVerification.success.description', 'Your free credits have been added')}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
