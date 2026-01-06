/**
 * React Query Configuration
 * 
 * Centralized React Query setup with:
 * - Query client configuration
 * - Default retry/stale time settings
 * - Error handling
 * - Devtools integration
 * 
 * @module lib/queryClient
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import { ApiClientError } from './apiClient';

// ============================================
// QUERY CLIENT CONFIGURATION
// ============================================

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - how long data is considered fresh
      staleTime: 30 * 1000, // 30 seconds
      
      // Cache time - how long unused data stays in cache
      gcTime: 5 * 60 * 1000, // 5 minutes (previously cacheTime)
      
      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (except 429)
        if (error instanceof ApiClientError) {
          if (error.status >= 400 && error.status < 500 && error.status !== 429) {
            return false;
          }
        }
        return failureCount < 2;
      },
      
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch settings
      refetchOnWindowFocus: false, // Prevent excessive refetches
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// ============================================
// QUERY KEYS FACTORY
// ============================================

/**
 * Centralized query key factory for consistent cache key management
 */
export const queryKeys = {
  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: (userId: string, filters?: object) => 
      ['dashboard', 'stats', userId, filters] as const,
    metrics: (userId: string) => ['dashboard', 'metrics', userId] as const,
  },
  
  // Interviews
  interviews: {
    all: ['interviews'] as const,
    list: (userId: string, filters?: { page?: number; limit?: number; status?: string }) => 
      ['interviews', 'list', userId, filters] as const,
    detail: (interviewId: string) => ['interviews', 'detail', interviewId] as const,
    feedback: (interviewId: string) => ['interviews', 'feedback', interviewId] as const,
  },
  
  // Resumes
  resumes: {
    all: ['resumes'] as const,
    list: (userId: string) => ['resumes', 'list', userId] as const,
    detail: (resumeId: string) => ['resumes', 'detail', resumeId] as const,
    scores: (resumeId: string) => ['resumes', 'scores', resumeId] as const,
  },
  
  // Wallet/Credits
  wallet: {
    all: ['wallet'] as const,
    balance: (userId: string) => ['wallet', 'balance', userId] as const,
    history: (userId: string) => ['wallet', 'history', userId] as const,
  },
  
  // User/Preferences
  user: {
    all: ['user'] as const,
    preferences: (userId: string) => ['user', 'preferences', userId] as const,
    profile: (userId: string) => ['user', 'profile', userId] as const,
  },
  
  // Billing
  billing: {
    all: ['billing'] as const,
    packages: () => ['billing', 'packages'] as const,
    history: (userId: string) => ['billing', 'history', userId] as const,
  },

  // Performance (deep dive)
  performance: {
    all: ['performance'] as const,
    summary: (userId: string, params?: { range?: string; role?: string; company?: string }) =>
      ['performance', 'summary', userId, params] as const,
    goal: (userId: string) => ['performance', 'goal', userId] as const,
  },
};

// ============================================
// CACHE INVALIDATION HELPERS
// ============================================

/**
 * Invalidate all dashboard data
 */
export function invalidateDashboard() {
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
}

/**
 * Invalidate interviews list after new interview
 */
export function invalidateInterviews() {
  queryClient.invalidateQueries({ queryKey: queryKeys.interviews.all });
}

/**
 * Invalidate resumes after upload/delete
 */
export function invalidateResumes() {
  queryClient.invalidateQueries({ queryKey: queryKeys.resumes.all });
}

/**
 * Invalidate wallet after purchase or credit use
 */
export function invalidateWallet() {
  queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all });
}

/**
 * Invalidate all user data (on logout or major change)
 */
export function invalidateAllUserData() {
  queryClient.clear();
}

// ============================================
// PROVIDER COMPONENT
// ============================================

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export default queryClient;
