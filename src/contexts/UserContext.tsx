/**
 * User Context Provider
 * 
 * Centralized user state management with caching.
 * Prevents multiple API calls by sharing state across all components.
 * 
 * Only refreshes data when:
 * - User logs in (initial validation)
 * - User purchases credits
 * - User completes an interview
 * - Manual refresh is triggered
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useUser } from '@clerk/clerk-react';
import apiService from '../services/APIService';
import { getDeviceFingerprint } from '../services/deviceFingerprint';

// Cache TTL for user data (5 minutes - but we manually invalidate on actions)
const USER_CACHE_KEY = 'Vocaid_user_cache';
const USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedUser {
  user: any;
  credits: number;
  timestamp: number;
}

interface UserContextType {
  // User state
  isLoading: boolean;
  isAuthenticated: boolean;
  isSynced: boolean;
  userCredits: number | null;
  dbUser: any | null;
  clerkUser: any | null;
  
  // Modals
  showCreditsModal: boolean;
  setShowCreditsModal: (show: boolean) => void;
  
  // Actions
  refreshCredits: () => Promise<void>;
  invalidateCache: () => void;
  consumeCredit: (callId?: string) => Promise<number>;
  restoreCredit: (reason?: string) => Promise<number>;
  
  // Events - call these after actions that change credits
  onCreditsPurchased: () => Promise<void>;
  onInterviewCompleted: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Helper function for retry with linear backoff
const retryWithBackoff = async <T,>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 500
): Promise<T> => {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * (attempt + 1);
        console.log(`🔄 Retry attempt ${attempt + 1}/${maxRetries} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// Get cached user from sessionStorage
const getCachedUser = (): CachedUser | null => {
  try {
    const cached = sessionStorage.getItem(USER_CACHE_KEY);
    if (!cached) return null;
    
    const parsed: CachedUser = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - parsed.timestamp < USER_CACHE_TTL) {
      return parsed;
    }
    
    // Cache expired
    sessionStorage.removeItem(USER_CACHE_KEY);
    return null;
  } catch {
    return null;
  }
};

// Save user to cache
const setCachedUser = (user: any, credits: number): void => {
  try {
    const cacheEntry: CachedUser = {
      user,
      credits,
      timestamp: Date.now()
    };
    sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(cacheEntry));
  } catch {
    // Ignore storage errors
  }
};

// Clear user cache
const clearUserCache = (): void => {
  try {
    sessionStorage.removeItem(USER_CACHE_KEY);
  } catch {
    // Ignore storage errors
  }
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isSynced, setIsSynced] = useState(false);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [dbUser, setDbUser] = useState<any>(null);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  
  // Refs to prevent duplicate calls
  const syncAttemptedRef = useRef(false);
  const syncInProgressRef = useRef(false);
  
  // Initial validation and sync
  useEffect(() => {
    const validateAndSyncUser = async () => {
      // Wait for Clerk to load
      if (!isLoaded) return;
      
      // User not signed in
      if (!isSignedIn || !clerkUser?.id) {
        setIsLoading(false);
        setUserCredits(0);
        setDbUser(null);
        setIsSynced(false);
        clearUserCache();
        return;
      }
      
      // Prevent duplicate calls
      if (syncAttemptedRef.current || syncInProgressRef.current) {
        return;
      }
      
      // Check cache first
      const cached = getCachedUser();
      if (cached) {
        console.log('📦 Using cached user data');
        setDbUser(cached.user);
        setUserCredits(cached.credits);
        setIsSynced(true);
        setIsLoading(false);
        syncAttemptedRef.current = true;
        return;
      }
      
      // No cache, fetch from backend
      syncInProgressRef.current = true;
      syncAttemptedRef.current = true;
      setIsLoading(true);
      
      try {
        console.log('🔐 Validating and syncing user to backend...');
        
        // Get device fingerprint for abuse detection (logged on backend)
        try {
          await getDeviceFingerprint();
        } catch {
          console.warn('⚠️ Could not get device fingerprint');
        }
        
        const result = await retryWithBackoff(
          () => apiService.validateUser(clerkUser.id),
          3,
          500
        );
        
        console.log('✅ User validation result:', result.message);
        
        const credits = result.user?.credits ?? 0;
        setDbUser(result.user);
        setUserCredits(credits);
        setIsSynced(true);
        
        // Cache the result
        setCachedUser(result.user, credits);
        
        if (result.freeTrialGranted) {
          console.log('🎉 Free trial credit granted to new user!');
        }
        
        if (result.freeCreditBlocked) {
          console.log('🚫 Free credit blocked (abuse detection)');
        }
      } catch (error) {
        console.error('⚠️ Failed to validate/sync user:', error);
        setIsSynced(false);
        syncAttemptedRef.current = false; // Allow retry on error
      } finally {
        setIsLoading(false);
        syncInProgressRef.current = false;
      }
    };
    
    validateAndSyncUser();
  }, [isLoaded, isSignedIn, clerkUser?.id]);
  
  // Clear state on sign out
  useEffect(() => {
    if (!isSignedIn) {
      syncAttemptedRef.current = false;
      setIsSynced(false);
      setDbUser(null);
      setUserCredits(0);
      clearUserCache();
      apiService.clearCache();
    }
  }, [isSignedIn]);
  
  // Refresh credits from backend (skips cache)
  const refreshCredits = useCallback(async () => {
    if (!clerkUser?.id) return;
    
    try {
      console.log('🔄 Refreshing credits from backend...');
      const result = await apiService.getCurrentUser(clerkUser.id);
      
      if (result.user?.credits !== undefined) {
        setUserCredits(result.user.credits);
        setDbUser(result.user);
        setCachedUser(result.user, result.user.credits);
        console.log('💳 Credits refreshed:', result.user.credits);
      }
    } catch (error) {
      console.error('Failed to refresh credits:', error);
    }
  }, [clerkUser?.id]);
  
  // Invalidate cache (forces next mount to fetch fresh data)
  const invalidateCache = useCallback(() => {
    clearUserCache();
    syncAttemptedRef.current = false;
    console.log('🗑️ User cache invalidated');
  }, []);
  
  // Consume credit
  const consumeCredit = useCallback(async (callId?: string): Promise<number> => {
    if (!isSignedIn || !clerkUser) {
      throw new Error('User not authenticated');
    }
    
    if ((userCredits ?? 0) <= 0) {
      throw new Error('Insufficient credits');
    }
    
    console.log('💳 Consuming credit via backend...');
    const response = await apiService.consumeCredit(clerkUser.id, callId);
    
    if (response.status === 'success') {
      const newCredits = response.newCredits ?? (userCredits ?? 1) - 1;
      setUserCredits(newCredits);
      setCachedUser(dbUser, newCredits);
      console.log('✅ Credit consumed, new balance:', newCredits);
      return newCredits;
    } else {
      throw new Error(response.message || 'Failed to consume credit');
    }
  }, [isSignedIn, clerkUser, userCredits, dbUser]);
  
  // Restore credit
  const restoreCredit = useCallback(async (reason?: string): Promise<number> => {
    if (!isSignedIn || !clerkUser) {
      throw new Error('User not authenticated');
    }
    
    console.log('💳 Restoring credit via backend...');
    const response = await apiService.restoreCredit(clerkUser.id, reason);
    
    if (response.status === 'success') {
      const newCredits = response.newCredits ?? (userCredits ?? 0) + 1;
      setUserCredits(newCredits);
      setCachedUser(dbUser, newCredits);
      console.log('✅ Credit restored, new balance:', newCredits);
      return newCredits;
    } else {
      throw new Error(response.message || 'Failed to restore credit');
    }
  }, [isSignedIn, clerkUser, userCredits, dbUser]);
  
  // Event handlers for credit changes
  const onCreditsPurchased = useCallback(async () => {
    console.log('💰 Credits purchased - refreshing...');
    invalidateCache();
    await refreshCredits();
  }, [invalidateCache, refreshCredits]);
  
  const onInterviewCompleted = useCallback(async () => {
    console.log('🎤 Interview completed - refreshing...');
    // Credits were already consumed, but refresh to ensure consistency
    await refreshCredits();
  }, [refreshCredits]);
  
  const value: UserContextType = {
    isLoading,
    isAuthenticated: isSignedIn ?? false,
    isSynced,
    userCredits,
    dbUser,
    clerkUser,
    showCreditsModal,
    setShowCreditsModal,
    refreshCredits,
    invalidateCache,
    consumeCredit,
    restoreCredit,
    onCreditsPurchased,
    onInterviewCompleted,
  };
  
  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the user context
export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};

// Backwards compatibility - wrapper around useUserContext
export const useAuthCheck = () => {
  const ctx = useUserContext();
  
  return {
    isSignedIn: ctx.isAuthenticated,
    user: ctx.clerkUser,
    isLoading: ctx.isLoading,
    userCredits: ctx.userCredits,
    showCreditsModal: ctx.showCreditsModal,
    setShowCreditsModal: ctx.setShowCreditsModal,
    updateCredits: async (action: 'use' | 'restore') => {
      if (action === 'use') {
        return ctx.consumeCredit();
      } else {
        return ctx.restoreCredit('Interview cancelled');
      }
    },
    refreshCredits: ctx.refreshCredits,
    isSynced: ctx.isSynced,
    dbUser: ctx.dbUser,
  };
};
