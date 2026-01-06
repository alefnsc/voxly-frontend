/**
 * Query Hooks Barrel Export
 * 
 * Centralized exports for all React Query hooks
 * 
 * @module hooks/queries
 */

// Dashboard / GraphQL
export {
  useGraphQLQuery,
  usePrefetchDashboard,
  useRefreshDashboard,
} from './useGraphQLQuery';

// Interviews
export {
  useInterviewsQuery,
  useInfiniteInterviewsQuery,
  useInterviewDetailQuery,
  useInterviewFeedbackQuery,
  useCreateInterviewMutation,
  useCloneInterviewMutation,
} from './useInterviewQueries';

// Resumes
export {
  useResumesQuery,
  useResumeDetailQuery,
  useUploadResumeMutation,
  useUpdateResumeMutation,
  useSetPrimaryResumeMutation,
  useDeleteResumeMutation,
  useLinkedInResumeMutation,
} from './useResumeQueries';

// Wallet/Credits
export {
  useWalletBalanceQuery,
  useWalletHistoryQuery,
  useBillingPackagesQuery,
  useBillingHistoryQuery,
  useConsumeCreditMutation,
  useRestoreCreditMutation,
  useCreatePaymentMutation,
  useCheckPaymentStatusMutation,
} from './useWalletQueries';
