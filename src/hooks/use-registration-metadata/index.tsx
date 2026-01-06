/**
 * Registration Metadata Hook
 * 
 * Provides registration metadata state and actions for first-party auth.
 * Uses backend API for metadata storage.
 * 
 * @module hooks/use-registration-metadata
 */

import { useCallback, useEffect, useState } from 'react';
import { useUser, useAuth } from 'contexts/AuthContext';
import { SupportedLanguageCode } from '../../lib/i18n';

// ========================================
// TYPES
// ========================================

export interface RegistrationMetadata {
  // Onboarding
  onboarding_complete: boolean;
  
  // Phone Verification
  phone_verification_skipped_for_credits?: boolean;
  
  // Language & Localization
  preferred_language: SupportedLanguageCode;
  languageSetByUser: boolean;
  
  // Registration Geolocation
  registration_region?: string;
  registration_country?: string;
  initial_ip?: string;
  
  // Timestamps
  registered_at?: string;
  metadata_updated_at?: string;
}

interface UseRegistrationMetadataReturn {
  // State
  metadata: RegistrationMetadata | null;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  
  // Actions
  captureRegistrationData: () => Promise<RegistrationMetadata | null>;
  updateMetadata: (updates: Partial<RegistrationMetadata>) => Promise<boolean>;
  markOnboardingComplete: () => Promise<boolean>;
  updatePreferredLanguage: (language: SupportedLanguageCode, setByUser?: boolean) => Promise<boolean>;
  
  // Status checks
  isNewUser: boolean;
  needsOnboarding: boolean;
}

// ========================================
// HOOK
// ========================================

export function useRegistrationMetadata(): UseRegistrationMetadataReturn {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { isSignedIn } = useAuth();
  
  const [metadata, setMetadata] = useState<RegistrationMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Derived state - use user.publicMetadata from first-party auth
  const pm = user?.publicMetadata || {};
  const isNewUser = !!(user && !pm.registered_at);
  const needsOnboarding = !!(user && pm.onboarding_complete !== true);
  
  /**
   * Get current metadata from user publicMetadata
   */
  const getCurrentMetadata = useCallback((): RegistrationMetadata | null => {
    if (!user) return null;
    
    const pm = user.publicMetadata || {};
    
    return {
      onboarding_complete: pm.onboarding_complete ?? false,
      phone_verification_skipped_for_credits: pm.phone_verification_skipped_for_credits ?? false,
      preferred_language: (pm.preferred_language as SupportedLanguageCode) ?? 'en-US',
      languageSetByUser: pm.languageSetByUser ?? false,
      registration_region: pm.registration_region,
      registration_country: pm.registration_country,
      initial_ip: pm.initial_ip,
      registered_at: pm.registered_at,
      metadata_updated_at: pm.metadata_updated_at,
    };
  }, [user]);
  
  /**
   * Capture registration data for new users
   * With first-party auth, registration data is captured on the backend during sign-up
   * This function now just returns the current metadata
   */
  const captureRegistrationData = useCallback(async (): Promise<RegistrationMetadata | null> => {
    if (!user) {
      console.warn('Cannot capture registration data: No user');
      return null;
    }
    
    // With first-party auth, registration is handled by the backend
    // Just return current metadata
    return getCurrentMetadata();
  }, [user, getCurrentMetadata]);
  
  /**
   * Update specific metadata fields
   * Note: With first-party auth, metadata updates should go through backend API
   * This is a simplified version that just updates local state
   */
  const updateMetadata = useCallback(async (updates: Partial<RegistrationMetadata>): Promise<boolean> => {
    if (!user) {
      console.warn('Cannot update metadata: No user');
      return false;
    }
    
    setIsSyncing(true);
    setError(null);
    
    try {
      // TODO: Call backend API to update user metadata when endpoint is available
      // For now, just update local state
      const updatedData = {
        ...updates,
        metadata_updated_at: new Date().toISOString(),
      };
      
      setMetadata(prev => prev ? { ...prev, ...updatedData } : null);
      console.log('Metadata updated locally:', updatedData);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update metadata';
      console.error('Failed to update metadata:', err);
      setError(message);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [user]);
  
  /**
   * Mark onboarding as complete
   */
  const markOnboardingComplete = useCallback(async (): Promise<boolean> => {
    return updateMetadata({ onboarding_complete: true });
  }, [updateMetadata]);
  
  /**
   * Update preferred language
   */
  const updatePreferredLanguage = useCallback(async (
    language: SupportedLanguageCode, 
    setByUser: boolean = true
  ): Promise<boolean> => {
    return updateMetadata({ 
      preferred_language: language, 
      languageSetByUser: setByUser 
    });
  }, [updateMetadata]);
  
  // Load metadata when user is available
  useEffect(() => {
    if (!isUserLoaded) return;
    
    if (!isSignedIn || !user) {
      setMetadata(null);
      setIsLoading(false);
      return;
    }
    
    // Get existing metadata
    const existing = getCurrentMetadata();
    setMetadata(existing);
    setIsLoading(false);
    
    // If new user, capture registration data
    if (!existing?.registered_at) {
      captureRegistrationData();
    }
  }, [isUserLoaded, isSignedIn, user, getCurrentMetadata, captureRegistrationData]);
  
  return {
    metadata,
    isLoading,
    isSyncing,
    error,
    captureRegistrationData,
    updateMetadata,
    markOnboardingComplete,
    updatePreferredLanguage,
    isNewUser,
    needsOnboarding,
  };
}

export default useRegistrationMetadata;
