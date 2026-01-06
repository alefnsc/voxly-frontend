/**
 * Performance Query Hooks
 *
 * React Query hooks for the Performance (deep dive) page.
 *
 * @module hooks/queries/usePerformanceQueries
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useUser } from 'contexts/AuthContext';
import { queryKeys } from '../../lib/queryClient';
import apiService, {
  PerformanceGoal,
  PerformanceRange,
  PerformanceSummary,
} from '../../services/APIService';

export function usePerformanceSummaryQuery(params: {
  range: PerformanceRange;
  role?: string;
  company?: string;
}) {
  const { user, isSignedIn, isLoaded } = useUser();

  const shouldFetch = isLoaded && isSignedIn && !!user?.id;

  return useQuery({
    queryKey: queryKeys.performance.summary(user?.id || '', params),
    queryFn: async (): Promise<PerformanceSummary> => {
      if (!user?.id) throw new Error('User not authenticated');
      return apiService.getPerformanceSummary(user.id, params);
    },
    enabled: shouldFetch,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function usePerformanceGoalQuery() {
  const { user, isSignedIn, isLoaded } = useUser();

  const shouldFetch = isLoaded && isSignedIn && !!user?.id;

  return useQuery({
    queryKey: queryKeys.performance.goal(user?.id || ''),
    queryFn: async (): Promise<PerformanceGoal> => {
      if (!user?.id) throw new Error('User not authenticated');
      return apiService.getPerformanceGoal(user.id);
    },
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
}

export function useUpdatePerformanceGoal() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      weeklyInterviewGoal: number;
      weeklyMinutesGoal?: number;
    }): Promise<PerformanceGoal> => {
      if (!user?.id) throw new Error('User not authenticated');
      return apiService.updatePerformanceGoal(user.id, input);
    },
    onSuccess: () => {
      if (!user?.id) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.performance.goal(user.id) });
    },
  });
}
