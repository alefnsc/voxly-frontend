/**
 * Post-Login Router
 * 
 * Handles routing after OAuth or email login.
 * Checks user state and redirects to appropriate onboarding step or dashboard.
 * 
 * Flow:
 * 1. If not signed in → /sign-in
 * 2. If account type not confirmed → /onboarding/account-type
 * 3. If hasPassword=false → /onboarding/password
 * 4. If consent missing → /onboarding/consent
 * 5. Otherwise → /app/b2c/dashboard
 * 
 * @module pages/PostLogin
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/APIService';

export default function PostLoginRouter() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoaded, isSignedIn } = useAuth();
  const [status, setStatus] = useState<'loading' | 'redirecting'>('loading');

  useEffect(() => {
    const handlePostLogin = async () => {
      // Wait for auth to load
      if (!isLoaded) return;

      // Not signed in - redirect to sign-in
      if (!isSignedIn || !user) {
        navigate('/sign-in', { replace: true });
        return;
      }

      setStatus('redirecting');

      try {
        // Step 1: Account type onboarding (must be completed for all users)
        if (!user.accountTypeConfirmedAt) {
          navigate('/onboarding/account-type', {
            replace: true,
            state: {
              returnTo: (location.state as any)?.returnTo || '/app/b2c/dashboard',
            },
          });
          return;
        }

        // Step 2: Check if user needs to set password
        if (user.hasPassword === false) {
          navigate('/onboarding/password', { replace: true });
          return;
        }

        // Step 3: Check consent status
        const consentStatus = await apiService.getConsentStatus();
        
        if (!consentStatus.hasRequiredConsents || consentStatus.needsReConsent) {
          navigate('/onboarding/consent', {
            replace: true,
            state: {
              returnTo: '/app/b2c/dashboard',
              source: user.authProviders.includes('google') ? 'OAUTH' : 'FORM',
            },
          });
          return;
        }

        // Step 4: All good - go to dashboard
        // Check if there's a returnTo in location state
        const returnTo = (location.state as any)?.returnTo || '/app/b2c/dashboard';
        navigate(returnTo, { replace: true });
      } catch (err: any) {
        console.error('[PostLogin] Error checking consent:', err);
        // On error, assume consent needed (safe default)
        navigate('/onboarding/consent', {
          replace: true,
          state: {
            returnTo: '/app/b2c/dashboard',
            source: user.authProviders.includes('google') ? 'OAUTH' : 'FORM',
          },
        });
      }
    };

    handlePostLogin();
  }, [isLoaded, isSignedIn, user, navigate, location.state]);

  // Show loading spinner
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 mx-auto mb-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-zinc-500">
          {status === 'loading' 
            ? t('auth.loading', 'Loading...')
            : t('common.redirecting', 'Redirecting...')
          }
        </p>
      </div>
    </div>
  );
}
