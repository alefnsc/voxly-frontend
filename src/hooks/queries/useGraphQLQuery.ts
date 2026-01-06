/**
 * GraphQL Query Hooks
 * 
 * React Query hooks for GraphQL data fetching with:
 * - Automatic caching and deduplication
 * - Background refetching
 * - Optimistic updates
 * - Error handling
 * - Mock data fallback for development
 * 
 * These hooks wrap the existing APIService methods with React Query.
 * 
 * @module hooks/queries/useGraphQLQuery
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from 'contexts/AuthContext';
import { useUserContext } from '../../contexts/UserContext';
import { queryKeys } from '../../lib/queryClient';
import apiService, {
  CandidateDashboardFilters,
  CandidateDashboardResponse,
} from '../../services/APIService';

// ============================================
// GRAPHQL QUERY
// ============================================

interface UseGraphQLQueryOptions {
  filters?: CandidateDashboardFilters;
  enabled?: boolean;
  /**
   * Whether to require user sync to be complete before fetching.
   * Set to false for read-only dashboard queries that should work even if sync fails.
   * Default: false (dashboard data is read-only and should be resilient)
   */
  requireSynced?: boolean;
}

/**
 * Query hook for fetching candidate dashboard data via GraphQL
 * 
 * Supports mock data fallback when REACT_APP_USE_MOCK_DATA=true
 * 
 * @example
 * const { data, isLoading, error, refetch } = useGraphQLQuery({
 *   filters: { roleTitle: 'Software Engineer', limit: 10 }
 * });
 */
export function useGraphQLQuery(options: UseGraphQLQueryOptions = {}) {
  const { user, isSignedIn, isLoaded } = useUser();
  const { isSynced } = useUserContext();
  const { filters = {}, enabled = true, requireSynced = false } = options;

  // Determine if query should be enabled
  // For read-only dashboard data, we don't need to wait for user sync
  const shouldFetch = enabled && isLoaded && isSignedIn && !!user?.id && (requireSynced ? isSynced : true);

  // Debug logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 useGraphQLQuery state:', {
      userId: user?.id?.slice(0, 15),
      isSignedIn,
      isLoaded,
      isSynced,
      requireSynced,
      shouldFetch,
    });
  }

  return useQuery({
    queryKey: queryKeys.dashboard.stats(user?.id || '', filters),
    queryFn: async (): Promise<CandidateDashboardResponse> => {
      if (!user?.id) throw new Error('User not authenticated');
      
      console.log('📡 Fetching dashboard data for user:', user.id.slice(0, 15));
      
      const result = await apiService.getCandidateDashboard(user.id, filters, false);
      
      console.log('📊 Dashboard data received:', {
        interviewCount: result.recentInterviews?.length ?? 0,
        scoreEvolutionPoints: result.scoreEvolution?.length ?? 0,
        avgScore: result.kpis?.averageScore,
      });
      
      return result;
    },
    enabled: shouldFetch,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      const message = (error as Error | undefined)?.message || '';
      // Auth/session failures won't resolve via retry and cause long-loading UIs.
      if (/unauthenticated|authentication required|missing authentication|session/i.test(message)) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Prefetch dashboard data (useful for route transitions)
 */
export function usePrefetchDashboard() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return async (filters?: CandidateDashboardFilters) => {
    if (!user?.id) return;
    
    await queryClient.prefetchQuery({
      queryKey: queryKeys.dashboard.stats(user.id, filters),
      queryFn: () => apiService.getCandidateDashboard(user.id, filters, false),
      staleTime: 60 * 1000,
    });
  };
}

// ============================================
// DASHBOARD MUTATIONS
// ============================================

/**
 * Mutation hook for manually refreshing dashboard data
 */
export function useRefreshDashboard() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (filters?: CandidateDashboardFilters) => {
      if (!user?.id) throw new Error('User not authenticated');
      return apiService.getCandidateDashboard(user.id, filters, true);
    },
    onSuccess: (data, filters) => {
      // Update the cache with fresh data
      queryClient.setQueryData(
        queryKeys.dashboard.stats(user?.id || '', filters),
        data
      );
    },
  });
}

export default useGraphQLQuery;
