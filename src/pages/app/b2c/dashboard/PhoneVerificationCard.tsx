/**
 * Phone Verification Card Component
 * 
 * Inline animated card for phone number verification flow.
 * Steps: Enter Phone → Enter Code → Success
 * 
 * Features:
 * - Searchable country dropdown with flags
 * - As-you-type phone formatting
 * - Validation with libphonenumber-js
 * 
 * Uses framer-motion for smooth transitions between steps.
 * 
 * @module pages/app/b2c/dashboard/PhoneVerificationCard
 */

'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useUser } from 'contexts/AuthContext';
import { Modal } from 'components/ui/modal';
import {
  Phone,
  CheckCircle2,
  Loader2,
  ChevronRight,
  ArrowLeft,
  Gift,
  Shield,
  AlertCircle,
  ChevronDown,
  Search,
} from 'lucide-react';
import apiService, { PhoneVerificationStatus } from '../../../../services/APIService';
import { useLanguage } from '../../../../hooks/use-language';
import {
  getAllCountriesWithCallingCodes,
  iso2ToFlag,
  getCountryDisplayName,
  formatAsYouType,
  normalizeToE164,
  validatePhone,
  getDefaultCountry,
  type CountryOption,
} from '../../../../lib/phone';
import type { CountryCode } from 'libphonenumber-js/max';

// ========================================
// TYPES
// ========================================

type VerificationStep = 'idle' | 'phone' | 'code' | 'success';

interface PhoneVerificationCardProps {
  onVerified?: () => void;
  className?: string;
}

// ========================================
// ANIMATION VARIANTS
// ========================================

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 20 : -20,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 20 : -20,
    opacity: 0,
    transition: { duration: 0.2 }
  })
};

const shakeVariants = {
  shake: {
    x: [0, -8, 8, -8, 8, 0],
    transition: { duration: 0.4 }
  }
};

// ========================================
// COMPONENT
// ========================================

export const PhoneVerificationCard: React.FC<PhoneVerificationCardProps> = ({
  onVerified,
  className = '',
}) => {
  const { t, i18n } = useTranslation();
  const { user } = useUser();
  const { preferredPhoneCountry, detectedCountry, setPreferredPhoneCountry } = useLanguage();
  const prefersReducedMotion = useReducedMotion();
  
  // Get all countries with calling codes (memoized with language)
  const allCountries = useMemo(
    () => getAllCountriesWithCallingCodes(i18n.language),
    [i18n.language]
  );
  
  // State
  const [step, setStep] = useState<VerificationStep>('idle');
  const [direction, setDirection] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState(''); // E.164 format for API calls
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [status, setStatus] = useState<PhoneVerificationStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const [creditsModalMessage, setCreditsModalMessage] = useState<string | null>(null);
  
  // Country selector state
  const [selectedCountry, setSelectedCountry] = useState<string>(() => 
    getDefaultCountry(preferredPhoneCountry, detectedCountry)
  );
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const countrySearchRef = useRef<HTMLInputElement>(null);
  
  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return allCountries;
    
    const search = countrySearch.toLowerCase();
    return allCountries.filter(c => {
      const displayName = getCountryDisplayName(i18n.language, c.iso2).toLowerCase();
      const dialCode = `+${c.dialCode}`;
      return (
        displayName.includes(search) ||
        c.iso2.toLowerCase().includes(search) ||
        dialCode.includes(search)
      );
    });
  }, [allCountries, countrySearch, i18n.language]);
  
  // Get selected country info
  const selectedCountryInfo = useMemo(() => 
    allCountries.find(c => c.iso2 === selectedCountry) || allCountries[0],
  [allCountries, selectedCountry]);
  
  // Refs for OTP inputs
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
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
  
  // Sync selected country from preferences
  useEffect(() => {
    if (preferredPhoneCountry) {
      setSelectedCountry(preferredPhoneCountry);
    }
  }, [preferredPhoneCountry]);
  
  // Fetch initial status
  useEffect(() => {
    const fetchStatus = async () => {
      if (!user?.id) return;
      
      try {
        const result = await apiService.getPhoneStatus();
        setStatus(result);
      } catch (err) {
        console.error('Failed to fetch phone status:', err);
      } finally {
        setIsLoadingStatus(false);
      }
    };
    
    fetchStatus();
  }, [user?.id]);
  
  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);
  
  // Focus first code input when entering code step
  useEffect(() => {
    if (step === 'code' && codeInputRefs.current[0]) {
      codeInputRefs.current[0]?.focus();
    }
  }, [step]);
  
  // Handler: Start verification flow
  const handleStartVerification = useCallback(() => {
    setDirection(1);
    setStep('phone');
    setError(null);
  }, []);
  
  // Handler: Select country
  const handleCountrySelect = useCallback((country: CountryOption) => {
    setSelectedCountry(country.iso2);
    setIsCountryDropdownOpen(false);
    setCountrySearch('');
    setPhoneNumber(''); // Clear phone when country changes
    
    // Persist the preference
    setPreferredPhoneCountry(country.iso2).catch(err => {
      console.warn('Failed to persist phone country preference:', err);
    });
  }, [setPreferredPhoneCountry]);
  
  // Handler: Phone input change with formatting
  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // If user types + at start, allow manual international entry
    if (value.startsWith('+')) {
      setPhoneNumber(value);
    } else {
      // Format with selected country
      const formatted = formatAsYouType(value, selectedCountry as CountryCode);
      setPhoneNumber(formatted);
    }
    setError(null);
  }, [selectedCountry]);
  
  // Handler: Send OTP
  const handleSendOTP = useCallback(async () => {
    if (!user?.id || !phoneNumber.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate phone number before sending
      const validation = validatePhone(phoneNumber, selectedCountry as CountryCode);
      if (!validation.isValid) {
        setError(validation.error || t('phoneVerification.errors.invalidPhone', 'Please enter a valid phone number'));
        setIsLoading(false);
        return;
      }
      
      // Normalize to E.164 format for API
      const e164Phone = normalizeToE164(phoneNumber, selectedCountry as CountryCode);
      if (!e164Phone) {
        setError(t('phoneVerification.errors.invalidPhone', 'Please enter a valid phone number'));
        setIsLoading(false);
        return;
      }
      
      // Store for verify/resend calls
      setNormalizedPhone(e164Phone);
      
      const result = await apiService.sendPhoneOTP(
        e164Phone,
        i18n.language
      );
      
      if (!result.success) {
        // Check for already-verified error
        if (result.code === 'PHONE_ALREADY_VERIFIED') {
          setError(t('phoneVerification.errors.alreadyVerified', 'You have already verified a phone number.'));
        } else {
          setError(result.error || t('phoneVerification.errors.sendFailed', 'Failed to send code'));
        }
        return;
      }
      
      // Success - move to code entry
      setDirection(1);
      setStep('code');
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || t('phoneVerification.errors.sendFailed', 'Failed to send code'));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, phoneNumber, selectedCountry, i18n.language, t]);
  
  // Handler: OTP input change
  const handleCodeChange = useCallback((index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    
    // Auto-advance to next input
    if (digit && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  }, [code]);
  
  // Handler: OTP input keydown (backspace)
  const handleCodeKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  }, [code]);
  
  // Handler: Verify OTP
  const handleVerifyOTP = useCallback(async () => {
    if (!user?.id) return;
    
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError(t('phoneVerification.errors.incompleteCode', 'Please enter the complete 6-digit code'));
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiService.verifyPhoneOTP(normalizedPhone, fullCode);
      
      if (!result.success || !result.verified) {
        setError(result.error || t('phoneVerification.errors.invalidCode', 'Invalid verification code'));
        // Shake the code inputs
        return;
      }
      
      // Success!
      // Claim trial credits (idempotent) and only then notify parent to refresh/hide CTA.
      let creditsGranted = 0;
      try {
        const claim = await apiService.claimTrialCredits();
        creditsGranted = claim?.data?.creditsGranted ?? 0;

        if (claim?.status === 'success' && creditsGranted > 0) {
          setCreditsModalMessage(
            t('phoneVerification.success.description', 'Your free credits have been added')
          );
          setIsCreditsModalOpen(true);
        }
      } catch {
        // Non-blocking: phone verification succeeded even if claim fails.
      }

      setDirection(1);
      setStep('success');

      // Parent should only hide CTA after backend confirms claim (or idempotent no-op).
      onVerified?.();
      
      // Refresh status
      const newStatus = await apiService.getPhoneStatus();
      setStatus(newStatus);
    } catch (err: any) {
      setError(err.message || t('phoneVerification.errors.verifyFailed', 'Verification failed'));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, normalizedPhone, code, t, onVerified]);
  
  // Handler: Resend OTP
  const handleResendOTP = useCallback(async () => {
    if (countdown > 0 || !user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiService.sendPhoneOTP(normalizedPhone, i18n.language);
      
      if (!result.success) {
        setError(result.error || t('phoneVerification.errors.resendFailed', 'Failed to resend code'));
        return;
      }
      
      setCountdown(60);
      setCode(['', '', '', '', '', '']);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [countdown, user?.id, normalizedPhone, i18n.language, t]);
  
  // Handler: Go back
  const handleBack = useCallback(() => {
    setDirection(-1);
    if (step === 'code') {
      setStep('phone');
      setCode(['', '', '', '', '', '']);
      setError(null);
    } else if (step === 'phone') {
      setStep('idle');
      setPhoneNumber('');
      setNormalizedPhone('');
      setError(null);
    }
  }, [step]);
  
  // If already verified, show success state
  if (status?.isVerified) {
    return (
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-green-800">
              {t('phoneVerification.verified', 'Phone Verified')}
            </p>
            <p className="text-xs text-green-600 truncate">
              {status.phoneNumber}
            </p>
          </div>
          <Shield className="h-4 w-4 text-green-500" />
        </div>
      </motion.div>
    );
  }
  
  // Loading status
  if (isLoadingStatus) {
    return (
      <div className={`bg-white rounded-xl p-4 border border-gray-200 animate-pulse ${className}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Phone className="h-5 w-5 text-gray-400" />
          </div>
          <div className="flex-1">
            <div className="h-4 bg-gray-100 rounded w-32 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-48" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div
      layout={!prefersReducedMotion}
      className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}
    >
      <AnimatePresence mode="wait" custom={direction}>
        {/* IDLE STATE: CTA to start verification */}
        {step === 'idle' && (
          <motion.div
            key="idle"
            custom={direction}
            variants={prefersReducedMotion ? {} : stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="p-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <Gift className="h-5 w-5 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-gray-900">
                  {t('phoneVerification.cta.title', 'Claim Free Credits')}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t('phoneVerification.cta.description', 'Verify your phone to get 5 free interview credits')}
                </p>
              </div>
            </div>
            <button
              onClick={handleStartVerification}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {t('phoneVerification.cta.button', 'Verify Phone')}
              <ChevronRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}
        
        {/* PHONE ENTRY STEP */}
        {step === 'phone' && (
          <motion.div
            key="phone"
            custom={direction}
            variants={prefersReducedMotion ? {} : stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={handleBack}
                className="p-1 -ml-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h3 className="text-sm font-semibold text-gray-900">
                {t('phoneVerification.phone.title', 'Enter Phone Number')}
              </h3>
            </div>
            
            <div className="space-y-3">
              {/* Country Selector + Phone Input */}
              <div>
                <div className="flex gap-2">
                  {/* Country Dropdown */}
                  <div ref={countryDropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                      disabled={isLoading}
                      className="flex items-center gap-1 px-2 py-2.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all disabled:opacity-50 min-w-[90px]"
                    >
                      <span className="text-base leading-none">{iso2ToFlag(selectedCountry)}</span>
                      <span className="text-gray-600">+{selectedCountryInfo.dialCode}</span>
                      <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Dropdown Panel */}
                    <AnimatePresence>
                      {isCountryDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.15 }}
                          className="absolute z-50 left-0 top-full mt-1 w-64 max-h-60 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
                        >
                          {/* Search Input */}
                          <div className="p-2 border-b border-gray-100">
                            <div className="relative">
                              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                              <input
                                ref={countrySearchRef}
                                type="text"
                                value={countrySearch}
                                onChange={(e) => setCountrySearch(e.target.value)}
                                placeholder={t('phoneVerification.phone.searchCountry', 'Search country...')}
                                className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none"
                              />
                            </div>
                          </div>
                          
                          {/* Country List */}
                          <div className="overflow-y-auto max-h-44">
                            {filteredCountries.length === 0 ? (
                              <div className="p-3 text-center text-sm text-gray-400">
                                {t('phoneVerification.phone.noCountries', 'No countries found')}
                              </div>
                            ) : (
                              filteredCountries.map((country) => (
                                <button
                                  key={country.iso2}
                                  type="button"
                                  onClick={() => handleCountrySelect(country)}
                                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-purple-50 transition-colors text-left ${
                                    country.iso2 === selectedCountry ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                                  }`}
                                >
                                  <span className="text-base leading-none">{iso2ToFlag(country.iso2)}</span>
                                  <span className="flex-1 truncate">
                                    {getCountryDisplayName(i18n.language, country.iso2)}
                                  </span>
                                  <span className="text-gray-400 text-xs">+{country.dialCode}</span>
                                </button>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Phone Input */}
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder={t('phoneVerification.phone.placeholder', '(555) 000-0000')}
                    className="flex-1 px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-shadow"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-400">
                  {t('phoneVerification.phone.hint', 'We\'ll send a 6-digit code via SMS')}
                </p>
              </div>
              
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-2 bg-red-50 rounded-lg"
                >
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-600">{error}</p>
                </motion.div>
              )}
              
              <button
                onClick={handleSendOTP}
                disabled={isLoading || !phoneNumber.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('common.sending', 'Sending...')}
                  </>
                ) : (
                  <>
                    {t('phoneVerification.phone.send', 'Send Code')}
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
        
        {/* CODE ENTRY STEP */}
        {step === 'code' && (
          <motion.div
            key="code"
            custom={direction}
            variants={prefersReducedMotion ? {} : stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={handleBack}
                className="p-1 -ml-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h3 className="text-sm font-semibold text-gray-900">
                {t('phoneVerification.code.title', 'Enter Verification Code')}
              </h3>
            </div>
            
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                {t('phoneVerification.code.sent', { phone: phoneNumber, defaultValue: 'Code sent to {{phone}}' })}
              </p>
              
              {/* OTP Inputs */}
              <motion.div 
                className="flex justify-center gap-2"
                variants={error ? shakeVariants : {}}
                animate={error ? 'shake' : undefined}
              >
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
                    className={`w-10 h-12 text-center text-lg font-semibold border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all ${
                      error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  />
                ))}
              </motion.div>
              
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-2 p-2 bg-red-50 rounded-lg"
                >
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-600">{error}</p>
                </motion.div>
              )}
              
              {/* Resend button with countdown */}
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-xs text-gray-400">
                    {t('phoneVerification.code.resendIn', {
                      seconds: countdown,
                      defaultValue: 'Resend in {{seconds}}s',
                    })}
                  </p>
                ) : (
                  <button
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                  >
                    {t('phoneVerification.code.resend', 'Resend code')}
                  </button>
                )}
              </div>
              
              <button
                onClick={handleVerifyOTP}
                disabled={isLoading || code.some(d => !d)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('common.verifying', 'Verifying...')}
                  </>
                ) : (
                  <>
                    {t('phoneVerification.code.verify', 'Verify')}
                    <CheckCircle2 className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
        
        {/* SUCCESS STATE */}
        {step === 'success' && (
          <motion.div
            key="success"
            custom={direction}
            variants={prefersReducedMotion ? {} : stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="p-4"
          >
            <div className="text-center py-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="inline-flex p-3 bg-green-100 rounded-full mb-3"
              >
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </motion.div>
              <h3 className="text-base font-semibold text-gray-900">
                {t('phoneVerification.success.title', 'Phone Verified!')}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {t('phoneVerification.success.description', 'Your 5 free credits have been added')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        title={t('phoneVerification.success.title', 'Phone Verified!')}
        isOpen={isCreditsModalOpen}
        onClose={() => setIsCreditsModalOpen(false)}
        className="max-w-md"
      >
        <div className="p-4">
          <p className="text-sm text-gray-600">
            {creditsModalMessage || t('phoneVerification.success.description', 'Your free credits have been added')}
          </p>
        </div>
      </Modal>
    </motion.div>
  );
};

export default PhoneVerificationCard;
