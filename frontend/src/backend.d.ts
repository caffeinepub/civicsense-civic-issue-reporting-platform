import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Time = bigint;
export interface Comment {
    id: string;
    content: string;
    userId: Principal;
    timestamp: Time;
    submissionId: string;
}
export interface LoginSuccess {
    redirectView: string;
    isAuthenticated: boolean;
    isMunicipalOperator: boolean;
}
export interface GeoCoordinates {
    latitude: number;
    longitude: number;
}
export interface Address {
    street: string;
    city: string;
    zipCode: string;
}
export interface StatusUpdate {
    updatedBy: Principal;
    notes: string;
    timestamp: Time;
    submissionId: string;
    newStatus: Status;
    previousStatus: Status;
}
export interface LoginError {
    code: LoginErrorCode;
    message: string;
}
export type LoginResult = {
    __kind__: "error";
    error: LoginError;
} | {
    __kind__: "success";
    success: LoginSuccess;
};
export interface Submission {
    id: string;
    status: Status;
    title: string;
    createdAt: Time;
    createdBy: Principal;
    description: string;
    updatedAt: Time;
    address?: Address;
    assignedStaff?: Principal;
    category: Category;
    priority: Priority;
    location?: GeoCoordinates;
    attachments: Array<ExternalBlob>;
}
export interface UserProfile {
    isMunicipalStaff: boolean;
    name: string;
    email: string;
    phone?: string;
}
export enum Category {
    streetlights = "streetlights",
    other = "other",
    potholes = "potholes",
    waste = "waste"
}
export enum LoginErrorCode {
    internalError = "internalError",
    unauthorized = "unauthorized",
    invalidCredentials = "invalidCredentials"
}
export enum Priority {
    low = "low",
    high = "high",
    medium = "medium"
}
export enum Status {
    reopened = "reopened",
    resolved = "resolved",
    closed = "closed",
    open = "open",
    inProgress = "inProgress"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_upvote_downvote {
    upvote = "upvote",
    downvote = "downvote"
}
export interface backendInterface {
    addComment(submissionId: string, content: string, commentId: string): Promise<void>;
    addVote(submissionId: string, voteType: Variant_upvote_downvote): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignSubmissionToStaff(id: string, staffPrincipal: Principal | null): Promise<void>;
    createSubmission(payload: Submission): Promise<string>;
    deleteComment(commentId: string): Promise<void>;
    deleteSubmission(id: string): Promise<void>;
    getAllSubmissions(): Promise<Array<Submission>>;
    getAnalytics(): Promise<{
        closedSubmissions: bigint;
        inProgressSubmissions: bigint;
        totalSubmissions: bigint;
        resolvedSubmissions: bigint;
        openSubmissions: bigint;
    }>;
    getAssignedSubmissions(): Promise<Array<Submission>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getComments(submissionId: string): Promise<Array<Comment>>;
    getMySubmissions(): Promise<Array<Submission>>;
    getStatusHistory(submissionId: string): Promise<Array<StatusUpdate>>;
    getSubmission(id: string): Promise<Submission>;
    getSubmissionByCategory(category: Category): Promise<Array<Submission>>;
    getSubmissionVersions(id: string): Promise<Array<string>>;
    getSubmissionsByStatus(status: Status): Promise<Array<Submission>>;
    getSubmissionsSortedByUpvotes(): Promise<Array<Submission>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVoteCount(submissionId: string): Promise<{
        upvotes: bigint;
        downvotes: bigint;
    }>;
    isCallerAdmin(): Promise<boolean>;
    login(isOperator: boolean): Promise<LoginResult>;
    removeVote(submissionId: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setMunicipalStaffStatus(user: Principal, isStaff: boolean): Promise<void>;
    updateSubmission(id: string, newPayload: Submission): Promise<void>;
    updateSubmissionStatus(id: string, newStatus: Status, notes: string): Promise<void>;
    uploadAttachment(submissionId: string, blobs: Array<ExternalBlob>): Promise<void>;
}
