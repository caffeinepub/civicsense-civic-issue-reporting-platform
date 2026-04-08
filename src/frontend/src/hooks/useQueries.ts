import type { Principal } from "@dfinity/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  Comment,
  Status,
  StatusUpdate,
  Submission,
} from "../types/domain";
import { getDemoSession } from "../utils/demoSession";
import {
  getAllIssues,
  getAnalytics,
  getComments,
  getMyIssues,
  getStatusHistory,
  createIssue as localCreateIssue,
  updateIssueStatus,
} from "../utils/localStore";

// ---------------------------------------------------------------------------
// Read queries — backed by local demo store (no actor needed)
// ---------------------------------------------------------------------------

export function useGetAllIssues() {
  return useQuery<Submission[]>({
    queryKey: ["issues"],
    queryFn: () => getAllIssues(),
    staleTime: 0,
  });
}

export function useGetIssue(id: string) {
  return useQuery<Submission | undefined>({
    queryKey: ["issue", id],
    queryFn: () => getAllIssues().find((i) => i.id === id),
    enabled: !!id,
  });
}

export function useGetMyIssues() {
  const session = getDemoSession();
  return useQuery<Submission[]>({
    queryKey: ["myIssues", session?.name],
    queryFn: () => getMyIssues(session?.name),
    enabled: !!session,
  });
}

export function useGetAssignedIssues() {
  return useQuery<Submission[]>({
    queryKey: ["assignedIssues"],
    queryFn: () => [],
  });
}

export function useGetAnalytics() {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: () => getAnalytics(),
    staleTime: 0,
  });
}

export function useGetStatusHistory(submissionId: string) {
  return useQuery<StatusUpdate[]>({
    queryKey: ["statusHistory", submissionId],
    queryFn: () => getStatusHistory(submissionId),
    enabled: !!submissionId,
  });
}

export function useGetComments(submissionId: string) {
  return useQuery<Comment[]>({
    queryKey: ["comments", submissionId],
    queryFn: () => getComments(submissionId),
    enabled: !!submissionId,
  });
}

export function useGetVoteCount(submissionId: string) {
  return useQuery<{ upvotes: bigint; downvotes: bigint }>({
    queryKey: ["voteCount", submissionId],
    queryFn: () => ({ upvotes: BigInt(0), downvotes: BigInt(0) }),
    enabled: !!submissionId,
  });
}

export function useIsCallerAdmin() {
  const session = getDemoSession();
  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: () => session?.role === "municipal",
    enabled: !!session,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

interface CreateIssuePayload {
  submission: Submission;
  imageDataUrls: string[];
  videoDataUrls: string[];
}

export function useCreateIssue() {
  const queryClient = useQueryClient();
  const session = getDemoSession();

  return useMutation({
    mutationFn: async ({
      submission,
      imageDataUrls,
      videoDataUrls,
    }: CreateIssuePayload) => {
      localCreateIssue(submission, session?.name, imageDataUrls, videoDataUrls);
      return submission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["myIssues"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Issue reported successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to report issue: ${error.message}`);
    },
  });
}

export function useUpdateIssueStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: { id: string; status: Status; notes: string }) => {
      updateIssueStatus(id, status, notes);
      return { id, status };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["issue", variables.id] });
      queryClient.invalidateQueries({
        queryKey: ["statusHistory", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Issue status updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });
}

export function useUploadAttachments() {
  return useMutation({
    mutationFn: async (_p: { submissionId: string; blobs: unknown[] }) =>
      undefined,
    onSuccess: () => {
      toast.success("Photos uploaded successfully");
    },
  });
}

export function useAddComment() {
  return useMutation({
    mutationFn: async (_p: {
      submissionId: string;
      content: string;
      commentId: string;
    }) => undefined,
    onSuccess: () => {
      toast.success("Comment added");
    },
  });
}

export function useAddVote() {
  return useMutation({
    mutationFn: async (_p: { submissionId: string; voteType: unknown }) =>
      undefined,
  });
}

export function useRemoveVote() {
  return useMutation({
    mutationFn: async (_id: string) => undefined,
  });
}

export function useAssignIssue() {
  return useMutation({
    mutationFn: async (_p: { id: string; staffPrincipal: Principal | null }) =>
      undefined,
  });
}

// Legacy stubs
export function useLogin() {
  return useMutation({
    mutationFn: async (_isOperator: boolean) => ({ __kind__: "ok" as const }),
  });
}

export function useGetCallerUserProfile() {
  return { data: null as null, isLoading: false, isFetched: true };
}

export function useSaveCallerUserProfile() {
  return useMutation({ mutationFn: async (_profile: unknown) => undefined });
}
