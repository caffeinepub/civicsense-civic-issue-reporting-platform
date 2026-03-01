import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { Submission, UserProfile, Comment, StatusUpdate, Status, Category, Variant_upvote_downvote, LoginResult } from '../backend';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';
import { Principal } from '@dfinity/principal';

// Login Mutation
export function useLogin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<LoginResult> => {
      if (!actor) throw new Error('Actor not available');
      // backend login() takes no arguments — role is determined server-side
      const result = await actor.login();
      return result;
    },
    onSuccess: (result: LoginResult) => {
      if (result.__kind__ === 'success') {
        queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
        queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
      }
    },
    // No onError toast here — LoginSelectionModal handles error display directly
  });
}

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    // Only fetch when actor is ready AND user is authenticated (has identity)
    // This prevents stale null returns for anonymous users
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
    // Ensure we always get fresh data after login
    staleTime: 0,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && !!identity && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile saved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save profile: ${error.message}`);
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching && !!identity,
    staleTime: 0,
  });
}

// Issue (Submission) Queries
export function useGetAllIssues() {
  const { actor, isFetching } = useActor();

  return useQuery<Submission[]>({
    queryKey: ['issues'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSubmissions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetIssue(id: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Submission>({
    queryKey: ['issue', id],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getSubmission(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useGetMyIssues() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Submission[]>({
    queryKey: ['myIssues'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMySubmissions();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useGetAssignedIssues() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Submission[]>({
    queryKey: ['assignedIssues'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAssignedSubmissions();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useGetSubmissionsByStatus(status: Status) {
  const { actor, isFetching } = useActor();

  return useQuery<Submission[]>({
    queryKey: ['submissionsByStatus', status],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSubmissionsByStatus(status);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSubmissionsByCategory(category: Category) {
  const { actor, isFetching } = useActor();

  return useQuery<Submission[]>({
    queryKey: ['submissionsByCategory', category],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSubmissionByCategory(category);
    },
    enabled: !!actor && !isFetching,
  });
}

// Mutation Hooks
export function useCreateIssue() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Submission) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createSubmission(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['myIssues'] });
      toast.success('Issue reported successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create issue: ${error.message}`);
    },
  });
}

export function useUpdateIssue() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Submission }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateSubmission(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['myIssues'] });
      toast.success('Issue updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update issue: ${error.message}`);
    },
  });
}

export function useUpdateIssueStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: Status;
      notes: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateSubmissionStatus(id, status, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['myIssues'] });
      queryClient.invalidateQueries({ queryKey: ['assignedIssues'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Status updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });
}

export function useAssignIssue() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      staffPrincipal,
    }: {
      id: string;
      staffPrincipal: Principal | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignSubmissionToStaff(id, staffPrincipal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['assignedIssues'] });
      toast.success('Issue assigned successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign issue: ${error.message}`);
    },
  });
}

export function useDeleteIssue() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteSubmission(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['myIssues'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Issue deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete issue: ${error.message}`);
    },
  });
}

// Comment Hooks
export function useGetComments(submissionId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Comment[]>({
    queryKey: ['comments', submissionId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getComments(submissionId);
    },
    enabled: !!actor && !isFetching && !!submissionId,
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      content,
      commentId,
    }: {
      submissionId: string;
      content: string;
      commentId: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addComment(submissionId, content, commentId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.submissionId] });
      toast.success('Comment added!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add comment: ${error.message}`);
    },
  });
}

export function useDeleteComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      submissionId,
    }: {
      commentId: string;
      submissionId: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteComment(commentId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.submissionId] });
      toast.success('Comment deleted!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete comment: ${error.message}`);
    },
  });
}

// Vote Hooks
export function useGetVoteCount(submissionId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<{ upvotes: bigint; downvotes: bigint }>({
    queryKey: ['votes', submissionId],
    queryFn: async () => {
      if (!actor) return { upvotes: BigInt(0), downvotes: BigInt(0) };
      return actor.getVoteCount(submissionId);
    },
    enabled: !!actor && !isFetching && !!submissionId,
  });
}

export function useAddVote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      voteType,
    }: {
      submissionId: string;
      voteType: Variant_upvote_downvote;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addVote(submissionId, voteType);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['votes', variables.submissionId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to vote: ${error.message}`);
    },
  });
}

export function useRemoveVote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submissionId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeVote(submissionId);
    },
    onSuccess: (_, submissionId) => {
      queryClient.invalidateQueries({ queryKey: ['votes', submissionId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove vote: ${error.message}`);
    },
  });
}

// Analytics
export function useGetAnalytics() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<{
    totalSubmissions: bigint;
    pendingSubmissions: bigint;
    inProgressSubmissions: bigint;
    resolvedSubmissions: bigint;
  }>({
    queryKey: ['analytics'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAnalytics();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

// Status History
export function useGetStatusHistory(submissionId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<StatusUpdate[]>({
    queryKey: ['statusHistory', submissionId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getStatusHistory(submissionId);
    },
    enabled: !!actor && !isFetching && !!submissionId,
  });
}

// Upload Attachment
export function useUploadAttachment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      blobs,
    }: {
      submissionId: string;
      blobs: ExternalBlob[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadAttachment(submissionId, blobs);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['issue', variables.submissionId] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success('Attachment uploaded successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload attachment: ${error.message}`);
    },
  });
}

// Seed Demo Data
export function useSeedDemoData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.seedDemoData();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['myIssues'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['assignedIssues'] });
      queryClient.invalidateQueries({ queryKey: ['submissionsByCategory'] });
      queryClient.invalidateQueries({ queryKey: ['submissionsByStatus'] });
      toast.success('Demo data seeded successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to seed demo data: ${error.message}`);
    },
  });
}
