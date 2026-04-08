/**
 * Domain types for CivicSense — defined here since the backend canister
 * is in demo mode with an empty interface.
 */
import type { Principal } from "@dfinity/principal";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export enum Category {
  potholes = "potholes",
  streetlights = "streetlights",
  waste = "waste",
  other = "other",
}

export enum Priority {
  low = "low",
  medium = "medium",
  high = "high",
}

export enum Status {
  open = "open",
  inProgress = "inProgress",
  resolved = "resolved",
  reopened = "reopened",
  closed = "closed",
}

export type Variant_upvote_downvote = "upvote" | "downvote";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface Location {
  latitude: number;
  longitude: number;
}

export interface Address {
  street: string;
  city: string;
  zipCode: string;
}

export interface Submission {
  id: string;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  location?: Location;
  address?: Address;
  createdBy: Principal;
  createdAt: bigint;
  updatedAt: bigint;
  attachments: string[];
  assignedStaff?: Principal;
}

export interface StatusUpdate {
  id: string;
  submissionId: string;
  status: Status;
  notes: string;
  updatedBy: Principal;
  updatedAt: bigint;
}

export interface Comment {
  id: string;
  submissionId: string;
  content: string;
  author: Principal;
  createdAt: bigint;
}

export interface UserProfile {
  name: string;
  email: string;
  isMunicipalStaff: boolean;
}

export interface LoginResult {
  __kind__: "ok" | "error";
  error?: string;
}
