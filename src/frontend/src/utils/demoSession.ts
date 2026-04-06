// Helpers for demo session stored in sessionStorage
export type DemoRole = "public" | "municipal";

export interface DemoSession {
  name: string;
  role: DemoRole;
}

export const DEMO_SESSION_KEY = "civicsense_demo_session";

export function getDemoSession(): DemoSession | null {
  try {
    const raw = sessionStorage.getItem(DEMO_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoSession;
  } catch {
    return null;
  }
}

export function setDemoSession(session: DemoSession): void {
  sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
}

export function clearDemoSession(): void {
  sessionStorage.removeItem(DEMO_SESSION_KEY);
}
