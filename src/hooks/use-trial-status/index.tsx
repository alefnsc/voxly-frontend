/**
 * Trial Status Hook
 * 
 * Provides access to the user's trial credit status including:
 * - Whether trial credits have been granted
 * - Promo period status
 * - Current balance
 * 
 * Uses the /api/credits/trial-status endpoint.
 * 
 * @module hooks/use-trial-status
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import apiService from '../../services/APIService';
import { isWithinOpenBetaWindow, getCurrentFreeCredits, getDaysRemaining, PROMO_END_DATE } from '../../config/openBeta';

// ==========================================
// TYPES
// ==========================================

export interface TrialStatus {
  /** Whether trial credits have been granted to this user */
  trialCreditsGranted: boolean;
  
  /** Amount of trial credits granted */
  trialCreditsAmount: number;
  
  /** When trial credits were granted (ISO string) */
  trialCreditsGrantedAt: string | null;
  
  /** Whether the promotional period is currently active */
  isPromoActive: boolean;
  
  /** When the promo period ends (ISO string) */
  promoEndsAt: string;
  
  /** Days remaining in promo period */
  promoRemainingDays: number;
  
  /** Current credit balance */
  currentBalance: number;
  
  /** Risk level assigned during signup */
  riskLevel: 'low' | 'medium' | 'high';
}

export interface PromoInfo {
  /** Whether promo is currently active */
  isPromoActive: boolean;
  
  /** When promo ends (ISO string) */
  promoEndsAt: string;
  
  /** Days remaining in promo */
  promoRemainingDays: number;
  
  /** Credits offered during promo */
  promoCredits: number;
  
  /** Credits offered after promo */
  standardCredits: number;
}

export interface UseTrialStatusReturn {
  /** Trial status data (null if not yet loaded) */
  status: TrialStatus | null;
  
  /** Promo info (available even when not signed in) */
  promoInfo: PromoInfo;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error message if fetch failed */
  error: string | null;
  
  /** Refresh trial status from server */
  refresh: () => Promise<void>;
  
  /** Check if user has received trial credits */
  hasReceivedTrial: boolean;
  
  /** Get credits amount for new signups */
  signupCredits: number;
}

// ==========================================
// HOOK IMPLEMENTATION
// ==========================================

export function useTrialStatus(): UseTrialStatusReturn {
  const { isLoaded, isSignedIn, user } = useUser();
  
  const [status, setStatus] = useState<TrialStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate promo info from config (available without auth)
  const promoInfo: PromoInfo = {
    isPromoActive: isWithinOpenBetaWindow(),
    promoEndsAt: PROMO_END_DATE.toISOString(),
    promoRemainingDays: getDaysRemaining(),
    promoCredits: 5,
    standardCredits: 1
  };

  // Current signup credits (what new users would get)
  const signupCredits = getCurrentFreeCredits();

  // Fetch trial status from API
  const refresh = useCallback(async () => {
    if (!isSignedIn || !user?.id) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getTrialStatus(user.id);
      
      if (response.status === 'success' && response.data) {
        setStatus(response.data);
      } else {
        setError(response.message || 'Failed to fetch trial status');
      }
    } catch (err: any) {
      console.error('[useTrialStatus] Error fetching status:', err);
      setError(err.message || 'Failed to fetch trial status');
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, user?.id]);

  // Auto-fetch on mount when signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      refresh();
    }
  }, [isLoaded, isSignedIn, refresh]);

  // Clear status when signed out
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setStatus(null);
      setError(null);
    }
  }, [isLoaded, isSignedIn]);

  return {
    status,
    promoInfo,
    isLoading,
    error,
    refresh,
    hasReceivedTrial: status?.trialCreditsGranted ?? false,
    signupCredits
  };
}

export default useTrialStatus;
