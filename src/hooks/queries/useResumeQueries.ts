/**
 * Resume Query Hooks
 * 
 * React Query hooks for resume repository with:
 * - List fetching
 * - Upload mutations
 * - Score fetching
 * - Delete mutations
 * 
 * @module hooks/queries/useResumeQueries
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from 'contexts/AuthContext';
import { useUserContext } from '../../contexts/UserContext';
import { queryKeys, invalidateResumes } from '../../lib/queryClient';
import apiService from '../../services/APIService';
import { isMockDataEnabled, getMockResumes } from '../../config/mockData';

// ============================================
// RESUMES LIST QUERY
// ============================================

/**
 * Query hook for fetching user's resumes
 */
export function useResumesQuery() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { isSynced } = useUserContext();

  return useQuery({
    queryKey: queryKeys.resumes.list(user?.id || ''),
    queryFn: async () => {
      // Use mock data in development when enabled
      if (isMockDataEnabled()) {
        console.log('🧪 Using mock resume data');
        return getMockResumes();
      }
      
      if (!user?.id) throw new Error('User not authenticated');
      const response = await apiService.getResumes(user.id);
      return response.data;
    },
    enabled: isLoaded && isSignedIn && (isMockDataEnabled() || (isSynced && !!user?.id)),
    staleTime: 60 * 1000, // 1 minute
  });
}

// ============================================
// RESUME DETAIL QUERY
// ============================================

/**
 * Query hook for fetching single resume details
 */
export function useResumeDetailQuery(resumeId: string | undefined, includeData = false) {
  const { user, isSignedIn } = useUser();

  return useQuery({
    queryKey: queryKeys.resumes.detail(resumeId || ''),
    queryFn: async () => {
      if (!resumeId || !user?.id) throw new Error('Missing parameters');
      const response = await apiService.getResumeById(user.id, resumeId, includeData);
      return response.data;
    },
    enabled: !!resumeId && !!user?.id && isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================
// RESUME MUTATIONS
// ============================================

/**
 * Mutation for uploading a new resume
 */
export function useUploadResumeMutation() {
  const { user } = useUser();

  return useMutation({
    mutationFn: async (data: {
      fileName: string;
      mimeType: string;
      base64Data: string;
      title?: string;
      description?: string;
      tags?: string[];
      isPrimary?: boolean;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return apiService.createResume(user.id, data);
    },
    onSuccess: () => {
      invalidateResumes();
    },
  });
}

/**
 * Mutation for updating resume metadata
 */
export function useUpdateResumeMutation() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ 
      resumeId, 
      data 
    }: { 
      resumeId: string; 
      data: { title?: string; description?: string; tags?: string[]; isPrimary?: boolean };
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return apiService.updateResume(user.id, resumeId, data);
    },
    onSuccess: (_, { resumeId }) => {
      // Invalidate both list and detail
      queryClient.invalidateQueries({ queryKey: queryKeys.resumes.list(user?.id || '') });
      queryClient.invalidateQueries({ queryKey: queryKeys.resumes.detail(resumeId) });
    },
  });
}

/**
 * Mutation for setting a resume as primary
 */
export function useSetPrimaryResumeMutation() {
  const { user } = useUser();

  return useMutation({
    mutationFn: async (resumeId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      return apiService.setPrimaryResume(user.id, resumeId);
    },
    onSuccess: () => {
      invalidateResumes();
    },
  });
}

/**
 * Mutation for deleting a resume
 */
export function useDeleteResumeMutation() {
  const { user } = useUser();

  return useMutation({
    mutationFn: async (resumeId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      return apiService.deleteResume(user.id, resumeId);
    },
    onSuccess: () => {
      invalidateResumes();
    },
  });
}

/**
 * Mutation for creating resume from LinkedIn
 */
export function useLinkedInResumeMutation() {
  const { user } = useUser();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      headline: string;
      linkedInUrl?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return apiService.createLinkedInResume(user.id, data);
    },
    onSuccess: () => {
      invalidateResumes();
    },
  });
}

export default useResumesQuery;
