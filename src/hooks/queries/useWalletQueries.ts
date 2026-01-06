/**
 * Wallet/Credits Query Hooks
 * 
 * React Query hooks for credits and billing with:
 * - Balance fetching
 * - Transaction history
 * - Credit purchase mutations
 * 
 * @module hooks/queries/useWalletQueries
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { useUser } from 'contexts/AuthContext';
import { useUserContext } from '../../contexts/UserContext';
import { queryKeys, invalidateWallet } from '../../lib/queryClient';
import apiService from '../../services/APIService';
import { isMockDataEnabled, getMockWalletData } from '../../config/mockData';

// ============================================
// WALLET BALANCE QUERY
// ============================================

/**
 * Query hook for fetching user's credit balance
 */
export function useWalletBalanceQuery() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { isSynced } = useUserContext();

  return useQuery({
    queryKey: queryKeys.wallet.balance(user?.id || ''),
    queryFn: async () => {
      // Use mock data in development when enabled
      if (isMockDataEnabled()) {
        console.log('🧪 Using mock wallet data');
        return getMockWalletData();
      }
      
      if (!user?.id) throw new Error('User not authenticated');
      const response = await apiService.getWalletBalance(user.id);
      return response;
    },
    enabled: isLoaded && isSignedIn && (isMockDataEnabled() || (isSynced && !!user?.id)),
    staleTime: 30 * 1000, // 30 seconds - balance can change after purchases
    refetchInterval: 60 * 1000, // Refetch every minute in background
  });
}

// ============================================
// WALLET HISTORY QUERY
// ============================================

/**
 * Query hook for fetching transaction history
 */
export function useWalletHistoryQuery(limit = 50) {
  const { user, isSignedIn, isLoaded } = useUser();
  const { isSynced } = useUserContext();

  return useQuery({
    queryKey: queryKeys.wallet.history(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const response = await apiService.getWalletHistory(user.id, { limit });
      return response;
    },
    enabled: isLoaded && isSignedIn && isSynced && !!user?.id,
    staleTime: 60 * 1000, // 1 minute
  });
}

// ============================================
// BILLING PACKAGES QUERY
// ============================================

/**
 * Query hook for fetching available credit packages
 */
export function useBillingPackagesQuery() {
  return useQuery({
    queryKey: queryKeys.billing.packages(),
    queryFn: async () => {
      // Credit packages are typically static configuration
      // This could fetch from API or return static config
      return [
        { id: 'starter', credits: 5, price: 9.99, currency: 'USD' },
        { id: 'pro', credits: 15, price: 24.99, currency: 'USD' },
        { id: 'enterprise', credits: 50, price: 69.99, currency: 'USD' },
      ];
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - packages rarely change
  });
}

// ============================================
// BILLING HISTORY QUERY
// ============================================

/**
 * Query hook for fetching payment history
 */
export function useBillingHistoryQuery() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { isSynced } = useUserContext();

  return useQuery({
    queryKey: queryKeys.billing.history(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      return apiService.getPaymentHistory(user.id);
    },
    enabled: isLoaded && isSignedIn && isSynced && !!user?.id,
    staleTime: 60 * 1000, // 1 minute
  });
}

// ============================================
// WALLET MUTATIONS
// ============================================

/**
 * Mutation for using credits (consumes a credit for interview)
 */
export function useConsumeCreditMutation() {
  const { user } = useUser();

  return useMutation({
    mutationFn: async (callId?: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      return apiService.consumeCredit(callId);
    },
    onSuccess: () => {
      invalidateWallet();
    },
  });
}

/**
 * Mutation for restoring credits (e.g., after failed interview)
 */
export function useRestoreCreditMutation() {
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ 
      reason,
      callId
    }: { 
      reason: string;
      callId?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return apiService.restoreCredit(reason, callId);
    },
    onSuccess: () => {
      invalidateWallet();
    },
  });
}

// ============================================
// PAYMENT MUTATIONS
// ============================================

type CreditPackageId = 'starter' | 'intermediate' | 'professional';

/**
 * Mutation for creating a geo-based payment (auto-selects provider based on region)
 */
export function useCreatePaymentMutation() {
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ 
      packageId, 
      language,
      provider
    }: { 
      packageId: CreditPackageId; 
      language?: string;
      provider?: 'mercadopago' | 'paypal';
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return apiService.createGeoPayment(user.id, {
        packageId,
        language,
        provider
      });
    },
  });
}

/**
 * Mutation for checking payment status
 */
export function useCheckPaymentStatusMutation() {
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ paymentId, provider }: { paymentId: string; provider: 'mercadopago' | 'paypal' }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return apiService.checkPaymentStatus(user.id, paymentId, provider);
    },
    onSuccess: (data) => {
      // Refresh wallet after successful payment
      if (data?.data?.status === 'approved') {
        invalidateWallet();
      }
    },
  });
}

export default useWalletBalanceQuery;
