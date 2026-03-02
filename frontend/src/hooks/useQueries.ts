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
    mutationFn: async (isOperator: boolean): Promise<LoginResult> => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.login(isOperator);
      return result;
    },
    onSuccess: (result: LoginResult) => {
      // Invalidate queries to refresh user data
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
      
      // Handle error results
      if (result.__kind__ === 'error') {
        console.error('Login error:', result.error);
      }
    },
    onError: (error: Error) => {
      console.error('Login mutation error:', error);
      toast.error(`Login failed: ${error.message}`);
    },
  });
}

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
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

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
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

  return useQuery<Submission[]>({
    queryKey: ['assignedIssues'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAssignedSubmissions();
    },
    enabled: !!actor && !isFetching,
  });
}

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
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Issue reported successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to report issue: ${error.message}`);
    },
  });
}

export function useUpdateIssueStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: Status; notes: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateSubmissionStatus(id, status, notes);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['issue', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['statusHistory', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Issue status updated');
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
    mutationFn: async ({ id, staffPrincipal }: { id: string; staffPrincipal: Principal | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignSubmissionToStaff(id, staffPrincipal);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['issue', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['assignedIssues'] });
      toast.success('Issue assigned successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign issue: ${error.message}`);
    },
  });
}

export function useUploadAttachments() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ submissionId, blobs }: { submissionId: string; blobs: ExternalBlob[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadAttachment(submissionId, blobs);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['issue', variables.submissionId] });
      queryClient.invalidateQueries({ queryKey: ['myIssues'] });
      toast.success('Photos uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload photos: ${error.message}`);
    },
  });
}

// Comments
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
    mutationFn: async ({ submissionId, content, commentId }: { submissionId: string; content: string; commentId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addComment(submissionId, content, commentId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.submissionId] });
      toast.success('Comment added');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add comment: ${error.message}`);
    },
  });
}

// Votes
export function useGetVoteCount(submissionId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<{ upvotes: bigint; downvotes: bigint }>({
    queryKey: ['voteCount', submissionId],
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
    mutationFn: async ({ submissionId, voteType }: { submissionId: string; voteType: Variant_upvote_downvote }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addVote(submissionId, voteType);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['voteCount', variables.submissionId] });
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
      queryClient.invalidateQueries({ queryKey: ['voteCount', submissionId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove vote: ${error.message}`);
    },
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

// Analytics
export function useGetAnalytics() {
  const { actor, isFetching } = useActor();

  return useQuery<{
    totalSubmissions: bigint;
    openSubmissions: bigint;
    inProgressSubmissions: bigint;
    resolvedSubmissions: bigint;
    closedSubmissions: bigint;
  }>({
    queryKey: ['analytics'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAnalytics();
    },
    enabled: !!actor && !isFetching,
  });
}
