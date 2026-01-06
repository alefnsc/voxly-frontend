/**
 * Credits Wallet Hook
 * 
 * Provides access to the user's credit wallet with balance and transaction history.
 * Uses the credits wallet API for detailed transaction tracking.
 * 
 * @module hooks/use-credits-wallet
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from 'contexts/AuthContext';
import apiService from '../../services/APIService';

// ==========================================
// TYPES
// ==========================================

export interface WalletBalance {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  totalPurchased: number;
  totalGranted: number;
  lastCreditAt?: string;
  lastDebitAt?: string;
}

export interface WalletTransaction {
  id: string;
  type: 'GRANT' | 'PURCHASE' | 'USAGE' | 'REFUND' | 'RESTORE' | 'PROMO' | 'REFERRAL' | 'ADMIN';
  amount: number;
  balanceAfter: number;
  description: string;
  referenceType?: string;
  referenceId?: string;
  createdAt: string;
}

export interface WalletHistoryPagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface UseCreditsWalletOptions {
  autoFetch?: boolean;
  historyLimit?: number;
}

export interface UseCreditsWalletReturn {
  // Balance
  balance: number | null;
  walletDetails: WalletBalance | null;
  
  // History
  transactions: WalletTransaction[];
  pagination: WalletHistoryPagination | null;
  
  // State
  isLoading: boolean;
  isLoadingHistory: boolean;
  error: string | null;
  
  // Actions
  refreshBalance: () => Promise<void>;
  fetchHistory: (options?: { limit?: number; offset?: number; type?: string }) => Promise<void>;
  loadMoreHistory: () => Promise<void>;
  checkCredits: (amount?: number) => Promise<boolean>;
}

// ==========================================
// HOOK IMPLEMENTATION
// ==========================================

export function useCreditsWallet(options: UseCreditsWalletOptions = {}): UseCreditsWalletReturn {
  const { autoFetch = true, historyLimit = 20 } = options;
  const { isLoaded, isSignedIn, user } = useUser();
  
  // Balance state
  const [walletDetails, setWalletDetails] = useState<WalletBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // History state
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [pagination, setPagination] = useState<WalletHistoryPagination | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch wallet balance
  const refreshBalance = useCallback(async () => {
    if (!isSignedIn || !user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getWalletBalance(user.id);
      
      if (response.status === 'success' && response.data) {
        setWalletDetails(response.data);
      } else {
        throw new Error('Invalid response');
      }
    } catch (err: any) {
      console.error('Failed to fetch wallet balance:', err);
      setError(err.message || 'Failed to load wallet');
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, user?.id]);

  // Fetch transaction history
  const fetchHistory = useCallback(async (
    fetchOptions?: { limit?: number; offset?: number; type?: string }
  ) => {
    if (!isSignedIn || !user?.id) return;
    
    setIsLoadingHistory(true);
    
    try {
      const response = await apiService.getWalletHistory(user.id, {
        limit: fetchOptions?.limit ?? historyLimit,
        offset: fetchOptions?.offset ?? 0,
        type: fetchOptions?.type,
      });
      
      if (response.status === 'success' && response.data) {
        // Cast transactions to proper type (API returns string type, we need union type)
        const typedTransactions = response.data.transactions as WalletTransaction[];
        
        if (fetchOptions?.offset && fetchOptions.offset > 0) {
          // Append to existing transactions
          setTransactions(prev => [...prev, ...typedTransactions]);
        } else {
          // Replace transactions
          setTransactions(typedTransactions);
        }
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      console.error('Failed to fetch wallet history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [isSignedIn, user?.id, historyLimit]);

  // Load more history
  const loadMoreHistory = useCallback(async () => {
    if (!pagination?.hasMore || isLoadingHistory) return;
    
    await fetchHistory({
      limit: historyLimit,
      offset: pagination.offset + pagination.limit,
    });
  }, [pagination, isLoadingHistory, fetchHistory, historyLimit]);

  // Check if user has enough credits
  const checkCredits = useCallback(async (amount: number = 1): Promise<boolean> => {
    if (!isSignedIn || !user?.id) return false;
    
    try {
      const response = await apiService.checkCredits(user.id, amount);
      return response.data?.hasEnough ?? false;
    } catch {
      return false;
    }
  }, [isSignedIn, user?.id]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && isLoaded && isSignedIn && user?.id) {
      refreshBalance();
    }
  }, [autoFetch, isLoaded, isSignedIn, user?.id, refreshBalance]);

  return {
    // Balance
    balance: walletDetails?.balance ?? null,
    walletDetails,
    
    // History
    transactions,
    pagination,
    
    // State
    isLoading,
    isLoadingHistory,
    error,
    
    // Actions
    refreshBalance,
    fetchHistory,
    loadMoreHistory,
    checkCredits,
  };
}

export default useCreditsWallet;
