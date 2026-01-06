/**
 * usePasswordRequired Hook
 * 
 * Checks if the current user needs to set a password.
 * SSO users must set a password as part of their onboarding.
 * 
 * @module hooks/use-password-required
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from 'contexts/AuthContext';
import apiService from 'services/APIService';

interface UsePasswordRequiredReturn {
  /** Whether the user needs to set a password */
  needsPassword: boolean;
  /** Whether we're still checking */
  isLoading: boolean;
  /** Any error that occurred */
  error: string | null;
  /** Refresh the password status */
  refresh: () => Promise<void>;
  /** Mark password as set (optimistic update) */
  markPasswordSet: () => void;
}

export function usePasswordRequired(): UsePasswordRequiredReturn {
  const { user, isLoaded: isUserLoaded } = useUser();
  
  const [needsPassword, setNeedsPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkPassword = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const hasPassword = await apiService.hasPassword(user.id);
      setNeedsPassword(!hasPassword);
    } catch (err: any) {
      console.error('Error checking password status:', err);
      setError(err.message || 'Failed to check password status');
      // Assume password is set on error to avoid blocking
      setNeedsPassword(false);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isUserLoaded && user?.id) {
      checkPassword();
    } else if (isUserLoaded && !user) {
      setIsLoading(false);
      setNeedsPassword(false);
    }
  }, [isUserLoaded, user?.id, checkPassword]);

  const markPasswordSet = useCallback(() => {
    setNeedsPassword(false);
  }, []);

  return {
    needsPassword,
    isLoading: !isUserLoaded || isLoading,
    error,
    refresh: checkPassword,
    markPasswordSet,
  };
}

export default usePasswordRequired;
