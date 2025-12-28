/**
 * Custom Sign-Up Component
 * 
 * Headless Clerk sign-up form with Vocaid premium styling.
 * Uses useSignUp hook for complete control over the UI.
 * Captures Role and Preferred Language for metadata.
 * 
 * @module components/auth/CustomSignUp
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useSignUp } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from 'lib/utils';
import { SUPPORTED_LANGUAGES } from 'lib/i18n';
import { useLanguage } from 'hooks/use-language';
import { signUpSchema, verificationSchema, USER_ROLES, SUPPORTED_COUNTRIES, SignUpFormData, UserRole } from './validation';
import { AuthInput } from './AuthInput';
import { AuthSelect } from './AuthSelect';
import { AuthButtons, AuthDivider } from './AuthButtons';
import { AuthLegalNotice } from './AuthLegalNotice';

// Form step types
type SignUpStep = 'form' | 'verification' | 'complete';

// Animation variants for form transitions
const fadeVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

interface CustomSignUpProps {
  onSuccess?: () => void;
  showTrustBar?: boolean;
  showFeaturePills?: boolean;
  className?: string;
}

export const CustomSignUp: React.FC<CustomSignUpProps> = ({
  onSuccess,
  showTrustBar = false,
  showFeaturePills = true,
  className,
}) => {
  const { signUp, isLoaded, setActive } = useSignUp();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const prefersReducedMotion = useReducedMotion();

  // Form state
  const [step, setStep] = useState<SignUpStep>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  
  // Form values
  const [formData, setFormData] = useState<SignUpFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Candidate' as UserRole,
    preferredLanguage: currentLanguage,
    countryCode: 'BR', // Default to Brazil (only supported country)
  });
  
  // Terms and marketing consent
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  
  // Verification code
  const [verificationCode, setVerificationCode] = useState('');
  
  // Field errors
  const [errors, setErrors] = useState<Partial<Record<keyof SignUpFormData, string>>>({});
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);

  // Language options from i18n config
  const languageOptions = Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => ({
    value: code,
    label: info.name,
    flag: info.flag,
  }));

  // Country options (Brazil-only enabled for now)
  const countryOptions = SUPPORTED_COUNTRIES.map((country) => ({
    value: country.code,
    label: `${country.flag} ${country.name}`,
    disabled: !country.enabled,
    sublabel: !country.enabled ? '(Coming soon)' : undefined,
  }));

  // Role options
  const roleOptions = USER_ROLES.map((role) => ({
    value: role,
    label: t(`auth.roles.${role.toLowerCase()}`, role),
  }));

  // Handle input change
  const handleChange = useCallback((field: keyof SignUpFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setGlobalError(null);
  }, []);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const result = signUpSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SignUpFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof SignUpFormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    
    // Validate terms acceptance
    if (!termsAccepted) {
      setTermsError(t('auth.errors.termsRequired', 'You must accept the Terms of Use and Privacy Policy'));
      return false;
    }
    
    setErrors({});
    setTermsError(null);
    return true;
  }, [formData, termsAccepted, t]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded || !signUp) return;
    if (!validateForm()) return;
    
    setIsLoading(true);
    setGlobalError(null);

    try {
      // Create the sign-up with Clerk
      await signUp.create({
        firstName: formData.firstName,
        lastName: formData.lastName,
        emailAddress: formData.email,
        password: formData.password,
      });

      // Prepare for email verification
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });

      setStep('verification');
    } catch (error: any) {
      console.error('Sign-up error:', error);
      const errorMessage = error.errors?.[0]?.longMessage || 
                          error.errors?.[0]?.message || 
                          t('auth.errors.signUpFailed', 'An error occurred during sign-up. Please try again.');
      setGlobalError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verification code submission
  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded || !signUp) return;
    
    // Validate code
    const codeResult = verificationSchema.safeParse({ code: verificationCode });
    if (!codeResult.success) {
      setVerificationError(codeResult.error.errors[0].message);
      return;
    }
    
    setIsLoading(true);
    setVerificationError(null);

    try {
      // Attempt verification
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === 'complete') {
        // Set the active session
        await setActive({ session: result.createdSessionId });
        
        // Update user metadata with role and language via backend
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/metadata`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              role: formData.role,
              preferredLanguage: formData.preferredLanguage,
              countryCode: formData.countryCode,
              marketingOptIn,
            }),
          });
          
          if (!response.ok) {
            console.warn('Failed to update user metadata, will retry on next login');
          }
        } catch (metadataError) {
          console.warn('Metadata update failed, will be handled by webhook:', metadataError);
        }
        
        setStep('complete');
        onSuccess?.();
        
        // Navigate to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        console.error('Verification incomplete:', result);
        setVerificationError(t('auth.errors.verificationIncomplete', 'Verification incomplete. Please try again.'));
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      const errorMessage = error.errors?.[0]?.longMessage || 
                          error.errors?.[0]?.message || 
                          t('auth.errors.invalidCode', 'Invalid verification code. Please try again.');
      setVerificationError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend verification code
  const handleResendCode = async () => {
    if (!isLoaded || !signUp) return;
    
    setIsLoading(true);
    setVerificationError(null);

    try {
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });
    } catch (error: any) {
      console.error('Resend error:', error);
      setVerificationError(t('auth.errors.resendFailed', 'Failed to resend code. Please try again.'));
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
    <>
      {/* Back to Home Link - Outside container */}
      <Link 
        to="/" 
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors mb-6 group"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {t('auth.backToHome', 'Back to Home')}
      </Link>

      <div className={cn('w-full', className)}>
        {/* Trust Bar (optional) */}
        {showTrustBar && step === 'form' && (
        <div className="mb-6 p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
          <p className="text-sm text-zinc-600 italic text-center">
            {t('auth.trustBar', '"Join thousands of professionals improving their interview skills with Vocaid."')}
          </p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Sign-Up Form Step */}
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
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-2">
                {t('auth.signUp.title', 'Create your account')}
              </h1>
              <p className="text-sm text-zinc-500">
                {t('auth.signUp.subtitle', 'Start practicing your interview skills today')}
              </p>
            </div>

            {/* OAuth Buttons */}
            <AuthButtons 
              mode="signUp" 
              onError={setGlobalError}
            />

            <AuthDivider />

            {/* Global Error */}
            {globalError && (
              <div className="mb-4 p-3 bg-zinc-50 border-l-4 border-black rounded-r">
                <p className="text-sm text-zinc-700">{globalError}</p>
              </div>
            )}

            {/* Sign-Up Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AuthInput
                  label={t('auth.firstName', 'First Name')}
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  error={errors.firstName}
                  placeholder="John"
                  autoComplete="given-name"
                  required
                />
                <AuthInput
                  label={t('auth.lastName', 'Last Name')}
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  error={errors.lastName}
                  placeholder="Doe"
                  autoComplete="family-name"
                  required
                />
              </div>

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
                autoComplete="new-password"
                required
              />

              {/* Role */}
              <AuthSelect
                label={t('auth.role', 'Current Role')}
                value={formData.role}
                onChange={(value) => handleChange('role', value)}
                options={roleOptions}
                error={errors.role}
                placeholder={t('auth.selectRole', 'Select your role')}
              />

              {/* Language */}
              <AuthSelect
                label={t('auth.preferredLanguage', 'Preferred Language')}
                value={formData.preferredLanguage}
                onChange={(value) => handleChange('preferredLanguage', value)}
                options={languageOptions}
                error={errors.preferredLanguage}
                placeholder={t('auth.selectLanguage', 'Select your language')}
              />

              {/* Country */}
              <AuthSelect
                label={t('auth.country', 'Country')}
                value={formData.countryCode}
                onChange={(value) => handleChange('countryCode', value)}
                options={countryOptions}
                error={errors.countryCode}
                placeholder={t('auth.selectCountry', 'Select your country')}
              />

              {/* Terms and Privacy with Checkboxes */}
              <AuthLegalNotice
                showCheckboxes
                termsAccepted={termsAccepted}
                onTermsChange={(accepted) => {
                  setTermsAccepted(accepted);
                  if (accepted) setTermsError(null);
                }}
                marketingOptIn={marketingOptIn}
                onMarketingChange={setMarketingOptIn}
              />
              
              {/* Terms Error */}
              {termsError && (
                <p className="text-xs text-zinc-700 mt-1">{termsError}</p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  'w-full py-3 px-4 mt-2 min-h-[44px] rounded-lg text-sm font-semibold',
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
                    {t('auth.creating', 'Creating account...')}
                  </span>
                ) : (
                  t('auth.signUp.button', 'Create Account')
                )}
              </button>
            </form>

            {/* Sign In Link */}
            <p className="mt-6 text-center text-sm text-zinc-500">
              {t('auth.haveAccount', 'Already have an account?')}{' '}
              <Link 
                to="/sign-in" 
                className="font-semibold text-purple-600 hover:text-purple-700 transition-colors focus:outline-none focus:underline"
              >
                {t('auth.signIn.link', 'Sign in')}
              </Link>
            </p>
          </motion.div>
        )}

        {/* Verification Step */}
        {step === 'verification' && (
          <motion.div
            key="verification"
            variants={fadeVariants}
            initial={prefersReducedMotion ? false : 'initial'}
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-2">
                {t('auth.verification.title', 'Verify your email')}
              </h1>
              <p className="text-sm text-zinc-500">
                {t('auth.verification.subtitle', 'We sent a verification code to')}{' '}
                <span className="font-medium text-zinc-700">{formData.email}</span>
              </p>
            </div>

            {/* Verification Error */}
            {verificationError && (
              <div className="mb-4 p-3 bg-zinc-50 border-l-4 border-black rounded-r">
                <p className="text-sm text-zinc-700">{verificationError}</p>
              </div>
            )}

            <form onSubmit={handleVerification} className="space-y-4">
              <AuthInput
                label={t('auth.verificationCode', 'Verification Code')}
                value={verificationCode}
                onChange={(e) => {
                  setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setVerificationError(null);
                }}
                placeholder="000000"
                maxLength={6}
                autoComplete="one-time-code"
                className="text-center text-lg tracking-widest"
              />

              <button
                type="submit"
                disabled={isLoading || verificationCode.length !== 6}
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
                  t('auth.verification.button', 'Verify Email')
                )}
              </button>
            </form>

            {/* Resend Code */}
            <p className="mt-6 text-center text-sm text-zinc-500">
              {t('auth.didntReceiveCode', "Didn't receive the code?")}{' '}
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isLoading}
                className="font-semibold text-purple-600 hover:text-purple-700 transition-colors disabled:opacity-50 focus:outline-none focus:underline"
              >
                {t('auth.resendCode', 'Resend')}
              </button>
            </p>

            {/* Back Button */}
            <button
              type="button"
              onClick={() => setStep('form')}
              className="mt-4 w-full text-center text-sm text-zinc-500 hover:text-zinc-700 transition-colors focus:outline-none focus:text-purple-600"
            >
              ← {t('auth.backToForm', 'Back to sign up')}
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
                {t('auth.complete.title', 'Welcome to Vocaid!')}
              </h2>
              <p className="text-sm text-zinc-500">
                {t('auth.complete.subtitle', 'Your account has been created successfully. Redirecting to dashboard...')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
};

export default CustomSignUp;
