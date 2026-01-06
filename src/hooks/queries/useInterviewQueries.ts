/**
 * Interview Query Hooks
 * 
 * React Query hooks for interview data with:
 * - List pagination
 * - Detail fetching
 * - Feedback loading
 * - Optimistic updates
 * 
 * @module hooks/queries/useInterviewQueries
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useUser } from 'contexts/AuthContext';
import { useUserContext } from '../../contexts/UserContext';
import { queryKeys, invalidateInterviews, invalidateWallet } from '../../lib/queryClient';
import apiService from '../../services/APIService';

// ============================================
// TYPES
// ============================================

interface InterviewListFilters {
  page?: number;
  limit?: number;
  status?: string;
  roleTitle?: string;
  seniority?: string;
}

// ============================================
// INTERVIEWS LIST QUERY
// ============================================

/**
 * Query hook for fetching paginated interviews list
 */
export function useInterviewsQuery(filters: InterviewListFilters = {}) {
  const { user, isSignedIn, isLoaded } = useUser();
  const { isSynced } = useUserContext();
  const { page = 1, limit = 20, ...otherFilters } = filters;

  return useQuery({
    queryKey: queryKeys.interviews.list(user?.id || '', { page, limit, ...otherFilters }),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      return apiService.getUserInterviews(user.id, page, limit, false);
    },
    enabled: isLoaded && isSignedIn && isSynced && !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });
}

/**
 * Infinite query for virtualized/infinite scroll interviews list
 */
export function useInfiniteInterviewsQuery(limit = 20) {
  const { user, isSignedIn, isLoaded } = useUser();
  const { isSynced } = useUserContext();

  return useInfiniteQuery({
    queryKey: ['interviews', 'infinite', user?.id],
    queryFn: async ({ pageParam = 1 }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return apiService.getUserInterviews(user.id, pageParam, limit, false);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // Assuming the API returns { interviews: [], total: number }
      const totalFetched = allPages.reduce(
        (acc, page) => acc + (page.interviews?.length || 0), 
        0
      );
      const total = lastPage.total || 0;
      if (totalFetched < total) {
        return allPages.length + 1;
      }
      return undefined;
    },
    enabled: isLoaded && isSignedIn && isSynced && !!user?.id,
    staleTime: 30 * 1000,
  });
}

// ============================================
// INTERVIEW DETAIL QUERY
// ============================================

/**
 * Query hook for fetching single interview details
 */
export function useInterviewDetailQuery(interviewId: string | undefined) {
  const { user, isSignedIn } = useUser();

  return useQuery({
    queryKey: queryKeys.interviews.detail(interviewId || ''),
    queryFn: async () => {
      if (!interviewId || !user?.id) throw new Error('Missing parameters');
      return apiService.getInterviewDetails(interviewId, user.id, false);
    },
    enabled: !!interviewId && !!user?.id && isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes - details rarely change
  });
}

// ============================================
// INTERVIEW FEEDBACK QUERY
// ============================================

/**
 * Query hook for fetching interview feedback
 * Note: This requires the Retell call ID, not the interview ID
 */
export function useInterviewFeedbackQuery(
  callId: string | undefined,
  options?: {
    structured?: boolean;
    seniority?: 'intern' | 'junior' | 'mid' | 'senior' | 'staff' | 'principal';
    language?: 'en' | 'es' | 'pt-BR' | 'zh-CN';
  }
) {
  const { user, isSignedIn } = useUser();

  return useQuery({
    queryKey: queryKeys.interviews.feedback(callId || ''),
    queryFn: async () => {
      if (!callId) throw new Error('Missing call ID');
      const response = await apiService.getFeedback(callId, options);
      if (!response.ok) {
        throw new Error(`Failed to fetch feedback: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!callId && !!user?.id && isSignedIn,
    staleTime: 10 * 60 * 1000, // 10 minutes - feedback doesn't change
    retry: 2,
  });
}

// ============================================
// INTERVIEW MUTATIONS
// ============================================

import type { CreateInterviewData } from '../../services/APIService';

/**
 * Mutation for creating a new interview record
 * Note: This creates the database record; starting the actual call is handled separately
 */
export function useCreateInterviewMutation() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (data: CreateInterviewData) => {
      if (!user?.id) throw new Error('User not authenticated');
      return apiService.createInterview(user.id, data);
    },
    onSuccess: () => {
      // Invalidate interviews list and wallet (credit was used)
      invalidateInterviews();
      invalidateWallet();
    },
  });
}

/**
 * Mutation for cloning/retrying an interview
 */
export function useCloneInterviewMutation() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ 
      interviewId, 
      useLatestResume = false 
    }: { 
      interviewId: string; 
      useLatestResume?: boolean;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return apiService.cloneInterview(user.id, interviewId, { useLatestResume });
    },
    onSuccess: () => {
      invalidateInterviews();
      invalidateWallet();
    },
  });
}

export default useInterviewsQuery;
