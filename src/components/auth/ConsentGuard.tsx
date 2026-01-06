/**
 * Consent Guard
 * 
 * Higher-order component that checks if a user has completed required consents.
 * Redirects to /onboarding/password if password is not set (OAuth users).
 * Redirects to /onboarding/consent if consent is missing or needs update.
 * 
 * Usage:
 * - Wrap protected routes with this component
 * - Works with both form sign-up and OAuth users
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../contexts/AuthContext';
import apiService from '../../services/APIService';

interface ConsentGuardProps {
  children: React.ReactNode;
  /**
   * If true, will show loading state while checking consent
   * If false, will render children immediately and redirect async
   */
  showLoading?: boolean;
}

// Cache consent status to avoid repeated API calls
const CONSENT_CACHE_KEY = 'vocaid_consent_status';
const CONSENT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedConsentStatus {
  hasConsent: boolean;
  timestamp: number;
}

function getCachedConsentStatus(): CachedConsentStatus | null {
  try {
    const cached = sessionStorage.getItem(CONSENT_CACHE_KEY);
    if (!cached) return null;

    const parsed = JSON.parse(cached) as CachedConsentStatus;
    if (Date.now() - parsed.timestamp > CONSENT_CACHE_TTL) {
      sessionStorage.removeItem(CONSENT_CACHE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function setCachedConsentStatus(hasConsent: boolean): void {
  try {
    const entry: CachedConsentStatus = {
      hasConsent,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(CONSENT_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Ignore storage errors
  }
}

export function clearConsentCache(): void {
  try {
    sessionStorage.removeItem(CONSENT_CACHE_KEY);
  } catch {
    // Ignore
  }
}

export function ConsentGuard({ children, showLoading = true }: ConsentGuardProps) {
  const { user, isLoaded, isSignedIn } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);

  const checkConsent = useCallback(async () => {
    // Not signed in - let normal auth flow handle it
    if (!isSignedIn || !user?.id) {
      setIsChecking(false);
      setHasConsent(true); // Don't block, auth will handle redirect
      return;
    }

    // First, check if user needs to set a password
    if (user.hasPassword === false) {
      navigate('/onboarding/password', {
        replace: true,
        state: {
          returnTo: location.pathname + location.search,
        },
      });
      setHasConsent(false);
      setIsChecking(false);
      return;
    }

    // Check cache first
    const cached = getCachedConsentStatus();
    if (cached?.hasConsent) {
      setHasConsent(true);
      setIsChecking(false);
      return;
    }

    // Check from backend
    try {
      const status = await apiService.getConsentStatus();
      
      const needsConsent = !status.hasRequiredConsents || status.needsReConsent;
      setHasConsent(!needsConsent);
      setCachedConsentStatus(!needsConsent);

      if (needsConsent) {
        // Determine source for OAuth users
        const source = user.authProviders?.includes('google') ? 'OAUTH' : 'FORM';
        
        navigate('/onboarding/consent', {
          replace: true,
          state: {
            returnTo: location.pathname + location.search,
            source,
          },
        });
      }
    } catch (error) {
      // Backend check failed (likely user not yet synced to DB).
      // For new users, redirect to consent to complete onboarding.
      // The consent page will create the user record via validateUser/submitConsent.
      console.warn('Consent check failed, redirecting to onboarding:', error);
      
      const source = user.authProviders?.includes('google') ? 'OAUTH' : 'FORM';
      navigate('/onboarding/consent', {
        replace: true,
        state: {
          returnTo: location.pathname + location.search,
          source,
        },
      });
      setHasConsent(false);
    } finally {
      setIsChecking(false);
    }
  }, [isSignedIn, user, navigate, location]);

  useEffect(() => {
    if (isLoaded) {
      checkConsent();
    }
  }, [isLoaded, checkConsent]);

  // Clear cache on sign out
  useEffect(() => {
    if (!isSignedIn) {
      clearConsentCache();
    }
  }, [isSignedIn]);

  // Show loading state
  if (!isLoaded || (isChecking && showLoading)) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading...</div>
      </div>
    );
  }

  // If checking async (showLoading=false) or consent confirmed, render children
  if (hasConsent === true || hasConsent === null) {
    return <>{children}</>;
  }

  // Redirecting to consent page
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="text-zinc-500">Redirecting...</div>
    </div>
  );
}

/**
 * Hook to check consent status
 * Use this for manual consent checks in components
 */
export function useConsentStatus() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [status, setStatus] = useState<{
    isLoading: boolean;
    hasConsent: boolean | null;
    needsReConsent: boolean;
    needsPassword: boolean;
  }>({
    isLoading: true,
    hasConsent: null,
    needsReConsent: false,
    needsPassword: false,
  });

  useEffect(() => {
    const fetchStatus = async () => {
      if (!isLoaded || !isSignedIn || !user?.id) {
        setStatus({ isLoading: false, hasConsent: null, needsReConsent: false, needsPassword: false });
        return;
      }

      // Check password status first
      const needsPassword = user.hasPassword === false;

      try {
        const result = await apiService.getConsentStatus();
        setStatus({
          isLoading: false,
          hasConsent: result.hasRequiredConsents && !result.needsReConsent,
          needsReConsent: result.needsReConsent,
          needsPassword,
        });
      } catch {
        setStatus({ isLoading: false, hasConsent: null, needsReConsent: false, needsPassword });
      }
    };

    fetchStatus();
  }, [isLoaded, isSignedIn, user?.id, user?.hasPassword]);

  return status;
}

export default ConsentGuard;
