/**
 * Consent Guard
 * 
 * Higher-order component that checks if a user has completed required consents.
 * Redirects to /onboarding/password if password is not set (OAuth users).
 * Redirects to /onboarding/consent if consent is missing or needs update.
 * 
 * Uses centralized onboarding routing logic from lib/onboarding.
 * 
 * Usage:
 * - Wrap protected routes with this component
 * - Works with both form sign-up and OAuth users
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../contexts/AuthContext';
import apiService from '../../services/APIService';
import { 
  getNextOnboardingRoute, 
  buildReturnToState,
  type OnboardingUser,
  type ConsentStatus,
} from '../../lib/onboarding';

// Debug logging (development only)
const DEBUG = process.env.NODE_ENV !== 'production';
function debugLog(message: string, data?: Record<string, unknown>): void {
  if (DEBUG) {
    console.log(`🛡️ [ConsentGuard] ${message}`, data ? data : '');
  }
}

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
    debugLog('Cache cleared');
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
    const currentPath = location.pathname + location.search;
    
    // Not signed in - let normal auth flow handle it
    if (!isSignedIn || !user?.id) {
      debugLog('Not signed in, allowing auth flow', { currentPath });
      setIsChecking(false);
      setHasConsent(true); // Don't block, auth will handle redirect
      return;
    }

    // Build user object for routing decision
    const onboardingUser: OnboardingUser = {
      id: user.id,
      accountTypeConfirmedAt: user.accountTypeConfirmedAt,
      hasPassword: user.hasPassword,
      phoneVerified: user.phoneVerified,
    };

    // Check pre-consent steps first (account type, password)
    // These don't require API calls
    const preConsentResult = getNextOnboardingRoute({
      user: onboardingUser,
      isAuthLoaded: isLoaded,
      isSignedIn,
      consentStatus: null, // Haven't checked yet
      currentPath,
    });

    // If we need account-type or password step, redirect immediately
    if (preConsentResult.nextRoute && 
        (preConsentResult.reason.includes('accountType') || 
         preConsentResult.reason.includes('password'))) {
      debugLog('Pre-consent step needed', { 
        nextRoute: preConsentResult.nextRoute, 
        reason: preConsentResult.reason 
      });
      navigate(preConsentResult.nextRoute, {
        replace: true,
        state: buildReturnToState(currentPath),
      });
      setHasConsent(false);
      setIsChecking(false);
      return;
    }

    // Check cache first for consent
    const cached = getCachedConsentStatus();
    if (cached?.hasConsent) {
      debugLog('Consent cached as complete', { currentPath });
      setHasConsent(true);
      setIsChecking(false);
      return;
    }

    // Check consent from backend
    try {
      debugLog('Checking consent status from backend', { currentPath });
      const status = await apiService.getConsentStatus();
      
      const consentStatus: ConsentStatus = {
        hasRequiredConsents: status.hasRequiredConsents,
        needsReConsent: status.needsReConsent,
      };

      // Use centralized routing logic
      const result = getNextOnboardingRoute({
        user: onboardingUser,
        isAuthLoaded: isLoaded,
        isSignedIn,
        consentStatus,
        currentPath,
      });

      debugLog('Routing decision', { 
        allowAccess: result.allowAccess, 
        nextRoute: result.nextRoute,
        reason: result.reason,
      });

      if (result.allowAccess) {
        setHasConsent(true);
        setCachedConsentStatus(true);
      } else if (result.nextRoute) {
        // Determine source for OAuth users (for analytics)
        const source = user.authProviders?.includes('google') ? 'OAUTH' : 'FORM';
        
        navigate(result.nextRoute, {
          replace: true,
          state: {
            ...buildReturnToState(currentPath),
            source,
          },
        });
        setHasConsent(false);
      }
    } catch (error) {
      // Backend check failed - redirect to consent
      debugLog('Consent check failed, redirecting to consent', { error });
      
      const source = user.authProviders?.includes('google') ? 'OAUTH' : 'FORM';
      navigate('/onboarding/consent', {
        replace: true,
        state: {
          ...buildReturnToState(currentPath),
          source,
        },
      });
      setHasConsent(false);
    } finally {
      setIsChecking(false);
    }
  }, [isSignedIn, user, navigate, location, isLoaded]);

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
