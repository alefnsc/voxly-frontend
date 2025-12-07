import { useUser } from '@clerk/clerk-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../../services/APIService';

// Helper function for retry with linear backoff (2s, 4s, 6s)
const retryWithBackoff = async <T,>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> => {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        // Linear backoff: 2s, 4s, 6s
        const delay = baseDelay * (attempt + 1);
        console.log(`🔄 Retry attempt ${attempt + 1}/${maxRetries} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

export const useAuthCheck = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [userCredits, setUserCredits] = useState<number | null>(null); // null = not loaded yet
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [dbUser, setDbUser] = useState<any>(null);
  const syncAttemptedRef = useRef(false);
  const syncInProgressRef = useRef(false);

  // Validate and sync user to backend on login
  // This ensures user exists in local database even if Clerk webhook wasn't received
  // PostgreSQL is the source of truth for credits
  useEffect(() => {
    const validateAndSyncUser = async () => {
      // Prevent duplicate calls and race conditions
      if (!isLoaded || !isSignedIn || !user?.id || syncAttemptedRef.current || syncInProgressRef.current) {
        if (isLoaded && !isSignedIn) {
          setIsLoading(false);
          setUserCredits(0);
        }
        return;
      }

      // Mark sync as in progress and attempted to prevent duplicate calls
      syncInProgressRef.current = true;
      syncAttemptedRef.current = true;
      setIsLoading(true);

      try {
        console.log('🔐 Validating and syncing user to backend on login...');
        // Use validateUser with retry logic for resilience
        const result = await retryWithBackoff(() => apiService.validateUser(user.id), 3, 500);
        console.log('✅ User validation result:', result.message);
        setIsSynced(true);
        setDbUser(result.user);
        
        // Backend PostgreSQL is source of truth for credits
        if (result.user?.credits !== undefined) {
          setUserCredits(result.user.credits);
          console.log('💳 Credits from PostgreSQL:', result.user.credits);
        } else {
          setUserCredits(0);
        }
        
        // If free trial was granted, log it
        if (result.freeTrialGranted) {
          console.log('🎉 Free trial credit granted to new user!');
        }
      } catch (error) {
        console.error('⚠️ Failed to validate/sync user to backend after retries:', error);
        // Don't block the app if sync fails - allow retry on next mount
        setIsSynced(false);
        syncAttemptedRef.current = false; // Allow retry on error
        // Keep userCredits as null to indicate unknown state
      } finally {
        setIsLoading(false);
        syncInProgressRef.current = false;
      }
    };

    validateAndSyncUser();
  }, [isLoaded, isSignedIn, user?.id]);

  // Reset sync flag when user signs out and clear cache
  useEffect(() => {
    if (!isSignedIn) {
      syncAttemptedRef.current = false;
      setIsSynced(false);
      setDbUser(null);
      setUserCredits(0);
      // Clear all cached data on logout
      apiService.clearCache();
    }
  }, [isSignedIn]);

  // Refresh credits from backend PostgreSQL
  const refreshCredits = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log('🔄 Refreshing credits from backend...');
      const result = await apiService.getCurrentUser(user.id);
      
      if (result.user?.credits !== undefined) {
        setUserCredits(result.user.credits);
        console.log('💳 Credits refreshed from PostgreSQL:', result.user.credits);
      }
    } catch (error) {
      console.error('Failed to refresh credits from backend:', error);
    }
  }, [user?.id]);

  // Update credits via backend API (deduct when starting interview)
  const updateCredits = useCallback(async (action: 'use' | 'restore') => {
    if (!isSignedIn || !user) {
      throw new Error('User not authenticated');
    }

    if (userCredits <= 0 && action === 'use') {
      throw new Error('Insufficient credits');
    }

    try {
      if (action === 'use') {
        // Call backend to consume credit
        console.log('💳 Consuming credit via backend...');
        const response = await apiService.consumeCredit(user.id);
        
        if (response.status === 'success') {
          const newCredits = response.newCredits ?? userCredits - 1;
          setUserCredits(newCredits);
          console.log('✅ Credit consumed, new balance:', newCredits);
          return newCredits;
        } else {
          throw new Error(response.message || 'Failed to consume credit');
        }
      } else {
        // Call backend to restore credit
        console.log('💳 Restoring credit via backend...');
        const response = await apiService.restoreCredit(user.id, 'Interview cancelled');
        
        if (response.status === 'success') {
          const newCredits = response.newCredits ?? userCredits + 1;
          setUserCredits(newCredits);
          console.log('✅ Credit restored, new balance:', newCredits);
          return newCredits;
        } else {
          throw new Error(response.message || 'Failed to restore credit');
        }
      }
    } catch (error) {
      console.error('Failed to update credits:', error);
      throw error;
    }
  }, [isSignedIn, user, userCredits]);

  return {
    isSignedIn,
    user,
    isLoading,
    userCredits,
    showCreditsModal,
    setShowCreditsModal,
    updateCredits,
    refreshCredits,
    isSynced, // Indicates if user has been synced to backend database
    dbUser,   // User data from backend database (includes UUID, full profile)
  };
};