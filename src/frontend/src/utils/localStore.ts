/**
 * Local demo data store — persists issues in localStorage so the UI works
 * without a live backend canister. All React Query hooks read/write here.
 */
import { Principal } from "@dfinity/principal";
import {
  Category,
  type Comment,
  Priority,
  Status,
  type StatusUpdate,
  type Submission,
} from "../types/domain";

const STORE_KEY = "civicsense_issues_v2";
const SEED_KEY = "civicsense_seeded_v2";

// Anonymous principal for demo use
export const DEMO_PRINCIPAL = Principal.fromText("2vxsx-fae");

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------
const SEED_ISSUES: Submission[] = [
  {
    id: "seed_1",
    title: "Large pothole on MG Road near bus stop",
    description:
      "A deep pothole approximately 2 feet wide has formed near the main bus stop on MG Road. It is causing damage to vehicles and is a safety hazard for two-wheelers.",
    category: Category.potholes,
    priority: Priority.high,
    status: Status.inProgress,
    address: {
      street: "MG Road, Near Bus Stop",
      city: "Bangalore",
      zipCode: "560001",
    },
    location: { latitude: 12.9716, longitude: 77.5946 },
    assignedStaff: undefined,
    createdBy: DEMO_PRINCIPAL,
    createdAt: BigInt(Date.now() - 14 * 86400000) * BigInt(1_000_000),
    updatedAt: BigInt(Date.now() - 10 * 86400000) * BigInt(1_000_000),
    attachments: [],
    videos: [],
  },
  {
    id: "seed_2",
    title: "Overflowing garbage bin at Koramangala market",
    description:
      "The garbage bin near Koramangala market has been overflowing for 3 days. Waste is spilling onto the footpath and causing a foul smell in the area.",
    category: Category.waste,
    priority: Priority.high,
    status: Status.open,
    address: {
      street: "Koramangala Market Road",
      city: "Bangalore",
      zipCode: "560034",
    },
    location: { latitude: 12.9352, longitude: 77.6245 },
    assignedStaff: undefined,
    createdBy: DEMO_PRINCIPAL,
    createdAt: BigInt(Date.now() - 3 * 86400000) * BigInt(1_000_000),
    updatedAt: BigInt(Date.now() - 2 * 86400000) * BigInt(1_000_000),
    attachments: [],
    videos: [],
  },
  {
    id: "seed_3",
    title: "Street light not working on Indiranagar 100ft Road",
    description:
      "Three consecutive street lights on 100ft Road, Indiranagar are not functioning for the past week. The area becomes very dark at night, posing safety risks.",
    category: Category.streetlights,
    priority: Priority.medium,
    status: Status.resolved,
    address: {
      street: "100ft Road, Indiranagar",
      city: "Bangalore",
      zipCode: "560038",
    },
    location: { latitude: 12.9784, longitude: 77.6408 },
    assignedStaff: undefined,
    createdBy: DEMO_PRINCIPAL,
    createdAt: BigInt(Date.now() - 10 * 86400000) * BigInt(1_000_000),
    updatedAt: BigInt(Date.now() - 5 * 86400000) * BigInt(1_000_000),
    attachments: [],
    videos: [],
  },
  {
    id: "seed_4",
    title: "Broken footpath tiles near Jayanagar park",
    description:
      "Multiple footpath tiles near Jayanagar 4th Block park are broken and uneven. Elderly citizens and children are at risk of tripping and falling.",
    category: Category.other,
    priority: Priority.medium,
    status: Status.open,
    address: {
      street: "4th Block, Jayanagar",
      city: "Bangalore",
      zipCode: "560041",
    },
    location: { latitude: 12.925, longitude: 77.5938 },
    assignedStaff: undefined,
    createdBy: DEMO_PRINCIPAL,
    createdAt: BigInt(Date.now() - 7 * 86400000) * BigInt(1_000_000),
    updatedAt: BigInt(Date.now() - 6 * 86400000) * BigInt(1_000_000),
    attachments: [],
    videos: [],
  },
  {
    id: "seed_5",
    title: "Illegal dumping of construction waste on Whitefield Road",
    description:
      "Construction debris has been illegally dumped on the roadside near Whitefield main road, blocking part of the lane and creating a hazard.",
    category: Category.waste,
    priority: Priority.high,
    status: Status.inProgress,
    address: {
      street: "Whitefield Main Road",
      city: "Bangalore",
      zipCode: "560066",
    },
    location: { latitude: 12.9698, longitude: 77.7499 },
    assignedStaff: undefined,
    createdBy: DEMO_PRINCIPAL,
    createdAt: BigInt(Date.now() - 5 * 86400000) * BigInt(1_000_000),
    updatedAt: BigInt(Date.now() - 3 * 86400000) * BigInt(1_000_000),
    attachments: [],
    videos: [],
  },
  {
    id: "seed_6",
    title: "Multiple potholes on Sarjapur Road stretch",
    description:
      "A 500-meter stretch of Sarjapur Road has developed multiple potholes after recent rains. Traffic is severely affected and accidents have been reported.",
    category: Category.potholes,
    priority: Priority.high,
    status: Status.open,
    address: {
      street: "Sarjapur Road, Near Wipro Gate",
      city: "Bangalore",
      zipCode: "560035",
    },
    location: { latitude: 12.901, longitude: 77.677 },
    assignedStaff: undefined,
    createdBy: DEMO_PRINCIPAL,
    createdAt: BigInt(Date.now() - 2 * 86400000) * BigInt(1_000_000),
    updatedAt: BigInt(Date.now() - 1 * 86400000) * BigInt(1_000_000),
    attachments: [],
    videos: [],
  },
  {
    id: "seed_7",
    title: "Street light flickering at HSR Layout Sector 2",
    description:
      "A street light at the main junction of HSR Layout Sector 2 is flickering continuously at night. It may indicate an electrical fault.",
    category: Category.streetlights,
    priority: Priority.low,
    status: Status.resolved,
    address: {
      street: "Sector 2, HSR Layout",
      city: "Bangalore",
      zipCode: "560102",
    },
    location: { latitude: 12.9116, longitude: 77.6389 },
    assignedStaff: undefined,
    createdBy: DEMO_PRINCIPAL,
    createdAt: BigInt(Date.now() - 8 * 86400000) * BigInt(1_000_000),
    updatedAt: BigInt(Date.now() - 4 * 86400000) * BigInt(1_000_000),
    attachments: [],
    videos: [],
  },
  {
    id: "seed_8",
    title: "Garbage not collected for 5 days in BTM Layout",
    description:
      "Garbage collection has not happened in BTM Layout 2nd Stage for 5 consecutive days. Waste is piling up outside homes and attracting stray animals.",
    category: Category.waste,
    priority: Priority.high,
    status: Status.open,
    address: {
      street: "2nd Stage, BTM Layout",
      city: "Bangalore",
      zipCode: "560076",
    },
    location: { latitude: 12.9166, longitude: 77.6101 },
    assignedStaff: undefined,
    createdBy: DEMO_PRINCIPAL,
    createdAt: BigInt(Date.now() - 5 * 86400000) * BigInt(1_000_000),
    updatedAt: BigInt(Date.now() - 4 * 86400000) * BigInt(1_000_000),
    attachments: [],
    videos: [],
  },
  {
    id: "seed_9",
    title: "Damaged road divider on Outer Ring Road",
    description:
      "The road divider near Marathahalli junction on Outer Ring Road has been damaged, likely due to a vehicle collision. It poses a risk to motorists.",
    category: Category.other,
    priority: Priority.medium,
    status: Status.inProgress,
    address: {
      street: "Outer Ring Road, Marathahalli",
      city: "Bangalore",
      zipCode: "560037",
    },
    location: { latitude: 12.9591, longitude: 77.6974 },
    assignedStaff: undefined,
    createdBy: DEMO_PRINCIPAL,
    createdAt: BigInt(Date.now() - 6 * 86400000) * BigInt(1_000_000),
    updatedAt: BigInt(Date.now() - 3 * 86400000) * BigInt(1_000_000),
    attachments: [],
    videos: [],
  },
  {
    id: "seed_10",
    title: "Pothole causing accidents near Electronic City flyover",
    description:
      "A large pothole at the base of Electronic City flyover has caused two minor accidents this week. Immediate repair is needed.",
    category: Category.potholes,
    priority: Priority.high,
    status: Status.resolved,
    address: {
      street: "Electronic City Phase 1",
      city: "Bangalore",
      zipCode: "560100",
    },
    location: { latitude: 12.8399, longitude: 77.677 },
    assignedStaff: undefined,
    createdBy: DEMO_PRINCIPAL,
    createdAt: BigInt(Date.now() - 9 * 86400000) * BigInt(1_000_000),
    updatedAt: BigInt(Date.now() - 2 * 86400000) * BigInt(1_000_000),
    attachments: [],
    videos: [],
  },
  {
    id: "seed_11",
    title: "Open manhole on Residency Road",
    description:
      "An open manhole without any cover or warning signs has been spotted on Residency Road. This is extremely dangerous for pedestrians and cyclists.",
    category: Category.other,
    priority: Priority.high,
    status: Status.inProgress,
    address: { street: "Residency Road", city: "Bangalore", zipCode: "560025" },
    location: { latitude: 12.9719, longitude: 77.6012 },
    assignedStaff: undefined,
    createdBy: DEMO_PRINCIPAL,
    createdAt: BigInt(Date.now() - 1 * 86400000) * BigInt(1_000_000),
    updatedAt: BigInt(Date.now() - 1 * 86400000) * BigInt(1_000_000),
    attachments: [],
    videos: [],
  },
  {
    id: "seed_12",
    title: "Street lights out in entire block of Rajajinagar",
    description:
      "All street lights in the 3rd Block of Rajajinagar have been non-functional for 10 days. Residents are concerned about safety.",
    category: Category.streetlights,
    priority: Priority.high,
    status: Status.open,
    address: {
      street: "3rd Block, Rajajinagar",
      city: "Bangalore",
      zipCode: "560010",
    },
    location: { latitude: 12.9915, longitude: 77.553 },
    assignedStaff: undefined,
    createdBy: DEMO_PRINCIPAL,
    createdAt: BigInt(Date.now() - 10 * 86400000) * BigInt(1_000_000),
    updatedAt: BigInt(Date.now() - 9 * 86400000) * BigInt(1_000_000),
    attachments: [],
    videos: [],
  },
];

// ---------------------------------------------------------------------------
// Persistence helpers (BigInt-safe)
// ---------------------------------------------------------------------------
function serializeIssues(issues: Submission[]): string {
  return JSON.stringify(issues, (_key, value) =>
    typeof value === "bigint" ? { __bigint__: value.toString() } : value,
  );
}

function deserializeIssues(raw: string): Submission[] {
  return JSON.parse(raw, (_key, value) => {
    if (value && typeof value === "object" && "__bigint__" in value) {
      return BigInt(value.__bigint__);
    }
    // Restore Principal objects
    if (value && typeof value === "object" && "_isPrincipal" in value) {
      try {
        return DEMO_PRINCIPAL;
      } catch {
        return DEMO_PRINCIPAL;
      }
    }
    return value;
  });
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
function loadIssues(): Submission[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const issues = deserializeIssues(raw);
    // Backfill videos field for issues saved before this field existed
    return issues.map((issue) => ({
      ...issue,
      videos: issue.videos ?? [],
    }));
  } catch {
    return [];
  }
}

function saveIssues(issues: Submission[]): void {
  try {
    localStorage.setItem(STORE_KEY, serializeIssues(issues));
  } catch {
    // storage may be full
  }
}

export function ensureSeeded(): void {
  if (localStorage.getItem(SEED_KEY)) return;
  const existing = loadIssues();
  if (existing.length >= 5) {
    localStorage.setItem(SEED_KEY, "true");
    return;
  }
  saveIssues([...existing, ...SEED_ISSUES]);
  localStorage.setItem(SEED_KEY, "true");
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------
export function getAllIssues(): Submission[] {
  ensureSeeded();
  return loadIssues();
}

export function getMyIssues(sessionName: string | undefined): Submission[] {
  if (!sessionName) return [];
  ensureSeeded();
  const all = loadIssues();
  // Issues submitted by the current demo user are tagged with their name
  return all.filter((i) => {
    try {
      // Principal that encodes the session name in text form won't match DEMO_PRINCIPAL
      // We use a localStorage key to track user-submitted issue IDs
      return getUserIssueIds(sessionName).includes(i.id);
    } catch {
      return false;
    }
  });
}

function getUserIssueKey(name: string): string {
  return `civicsense_user_issues_${name.toLowerCase().replace(/\s+/g, "_")}`;
}

export function getUserIssueIds(name: string): string[] {
  try {
    const raw = localStorage.getItem(getUserIssueKey(name));
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function registerUserIssue(name: string, id: string): void {
  const ids = getUserIssueIds(name);
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem(getUserIssueKey(name), JSON.stringify(ids));
  }
}

export function createIssue(
  issue: Submission,
  submittedByName?: string,
  imageDataUrls?: string[],
  videoDataUrls?: string[],
): void {
  ensureSeeded();
  const issues = loadIssues();
  const issueWithMedia: Submission = {
    ...issue,
    attachments:
      imageDataUrls && imageDataUrls.length > 0
        ? imageDataUrls
        : issue.attachments,
    videos:
      videoDataUrls && videoDataUrls.length > 0
        ? videoDataUrls
        : (issue.videos ?? []),
  };
  issues.unshift(issueWithMedia);
  saveIssues(issues);
  if (submittedByName) {
    registerUserIssue(submittedByName, issue.id);
  }
}

export function updateIssueStatus(
  id: string,
  status: Status,
  _notes: string,
): void {
  const issues = loadIssues();
  const idx = issues.findIndex((i) => i.id === id);
  if (idx >= 0) {
    issues[idx] = {
      ...issues[idx],
      status,
      updatedAt: BigInt(Date.now()) * BigInt(1_000_000),
    };
    saveIssues(issues);
  }
}

export function getAnalytics() {
  ensureSeeded();
  const issues = loadIssues();
  return {
    totalSubmissions: BigInt(issues.length),
    openSubmissions: BigInt(
      issues.filter((i) => i.status === Status.open).length,
    ),
    inProgressSubmissions: BigInt(
      issues.filter((i) => i.status === Status.inProgress).length,
    ),
    resolvedSubmissions: BigInt(
      issues.filter((i) => i.status === Status.resolved).length,
    ),
    closedSubmissions: BigInt(
      issues.filter((i) => i.status === Status.closed).length,
    ),
  };
}

export function getStatusHistory(_id: string): StatusUpdate[] {
  return [];
}

export function getComments(_id: string): Comment[] {
  return [];
}
