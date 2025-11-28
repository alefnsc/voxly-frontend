import { useUser } from '@clerk/clerk-react';
import { useState, useEffect, useCallback } from 'react';
import mercadoPagoService from '../../services/MercadoPagoService';

export const useAuthCheck = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [showCreditsModal, setShowCreditsModal] = useState(false);

  // Load user credits from Clerk publicMetadata
  useEffect(() => {
    const loadUserCredits = async () => {
      if (!isLoaded) {
        console.log('🔄 Clerk not loaded yet');
        setIsLoading(false);
        return;
      }

      // If user is not signed in, set credits to 0
      if (!isSignedIn || !user) {
        console.log('🚫 User not signed in');
        setIsLoading(false);
        setUserCredits(0);
        return;
      }

      console.log('👤 User signed in:', user.id);
      console.log('🔍 Loading credits from publicMetadata...');

      try {
        // Get credits from Clerk publicMetadata with validation
        const creditsValue = user.publicMetadata?.credits;
        
        // Validate credits to prevent injection and ensure it's a valid number
        let credits = 0;
        if (typeof creditsValue === 'number' && !isNaN(creditsValue) && creditsValue >= 0) {
          credits = Math.floor(creditsValue); // Ensure integer value
        } else if (typeof creditsValue === 'string') {
          const parsed = parseInt(creditsValue, 10);
          if (!isNaN(parsed) && parsed >= 0) {
            credits = parsed;
          }
        }
        
        console.log('💰 User credits from metadata:', credits);
        setUserCredits(credits);
      } catch (error) {
        console.error('❌ Error loading user credits:', error);
        setUserCredits(0);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserCredits();
  }, [isLoaded, isSignedIn, user]);

  // Refresh credits from Clerk after purchase
  const refreshCredits = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Reload user to get updated metadata
      await user.reload();
      
      // Validate the refreshed credits value
      const creditsValue = user.publicMetadata?.credits;
      let updatedCredits = 0;
      
      if (typeof creditsValue === 'number' && !isNaN(creditsValue) && creditsValue >= 0) {
        updatedCredits = Math.floor(creditsValue);
      } else if (typeof creditsValue === 'string') {
        const parsed = parseInt(creditsValue, 10);
        if (!isNaN(parsed) && parsed >= 0) {
          updatedCredits = parsed;
        }
      }
      
      console.log('🔄 Credits refreshed:', updatedCredits);
      setUserCredits(updatedCredits);
    } catch (error) {
      console.error('Failed to refresh credits:', error);
    }
  }, [user]);

  // Update credits (deduct when starting interview)
  const updateCredits = useCallback(async (action: 'use' | 'restore') => {
    if (!isSignedIn || !user) {
      throw new Error('User not authenticated');
    }

    if (userCredits <= 0 && action === 'use') {
      throw new Error('Insufficient credits');
    }

    try {
      if (action === 'use') {
        // Optimistic update - deduct credit locally
        const newCredits = userCredits - 1;
        console.log(`💰 Credits updated: ${userCredits} → ${newCredits}`);
        setUserCredits(newCredits);
        
        // Note: In production, this should trigger a serverless function
        // that uses Clerk Admin API to update user metadata
        // For now, we're doing optimistic client-side update
        console.warn('⚠️ Credit deduction should be persisted via serverless function');
        
        return newCredits;
      } else {
        // Restore credit (add back)
        const newCredits = userCredits + 1;
        setUserCredits(newCredits);
        await refreshCredits();
        return newCredits;
      }
    } catch (error) {
      console.error('Failed to update credits:', error);
      throw error;
    }
  }, [isSignedIn, user, userCredits, refreshCredits]);

  return {
    isSignedIn,
    user,
    isLoading,
    userCredits,
    showCreditsModal,
    setShowCreditsModal,
    updateCredits,
    refreshCredits,
  };
};
