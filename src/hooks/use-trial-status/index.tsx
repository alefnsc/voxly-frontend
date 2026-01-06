/**
 * Trial Status Hook
 * 
 * Provides access to the user's trial credit status including:
 * - Whether trial credits have been claimed
 * - Claim eligibility + block reason
 * - Current balance
 * 
 * Uses the /api/credits/trial-status endpoint.
 * 
 * @module hooks/use-trial-status
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from 'contexts/AuthContext';
import apiService from '../../services/APIService';

// ==========================================
// TYPES
// ==========================================

export interface TrialStatus {
  /** Whether trial credits have been claimed by this user */
  trialCreditsClaimed: boolean;
  
  /** Amount of trial credits */
  trialCreditsAmount: number;
  
  /** When trial credits were claimed (ISO string) */
  trialCreditsClaimedAt: string | null;
  
  /** Current credit balance */
  currentBalance: number;

  /** Whether user can claim trial credits right now */
  canClaim: boolean;

  /** If blocked, why */
  blockedReason: string | null;
}

export interface UseTrialStatusReturn {
  /** Trial status data (null if not yet loaded) */
  status: TrialStatus | null;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error message if fetch failed */
  error: string | null;
  
  /** Refresh trial status from server */
  refresh: () => Promise<void>;
  
  /** Check if user has received trial credits */
  hasReceivedTrial: boolean;
  
  /** Amount of trial credits (fixed policy) */
  trialCreditsAmount: number;
}

// ==========================================
// HOOK IMPLEMENTATION
// ==========================================

export function useTrialStatus(): UseTrialStatusReturn {
  const { isLoaded, isSignedIn, user } = useUser();
  
  const [status, setStatus] = useState<TrialStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trialCreditsAmount = 5;

  // Fetch trial status from API
  const refresh = useCallback(async () => {
    if (!isSignedIn || !user?.id) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getTrialStatus();
      
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
    isLoading,
    error,
    refresh,
    hasReceivedTrial: status?.trialCreditsClaimed ?? false,
    trialCreditsAmount
  };
}

export default useTrialStatus;
