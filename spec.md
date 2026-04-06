# CivicSense

## Current State
Login uses Internet Identity (II) which opens an external popup, waits for cryptographic key derivation, then calls the backend `login()` mutation. This multi-step async chain causes significant lag (3-10+ seconds) before the user lands in the app. The LoginSelectionModal shows role cards, then triggers II, then calls backend login.

## Requested Changes (Diff)

### Add
- Instant demo login: a simple modal with a name input and role selection (Public User / Municipal Staff), no external auth popup
- Local session storage for demo identity (name, role) so the app renders immediately after clicking login
- Demo bypass flag in the auth context so components can detect "demo mode" vs real II

### Modify
- `LoginSelectionModal` — replace II flow with instant form (name + role picker + single button)
- `App.tsx` — check demo session on mount, skip profile setup modal if demo session exists
- `HomePage.tsx` — read demo session to determine authenticated/municipal state without waiting for actor
- `Header.tsx` — show user name from demo session, logout clears session and reloads

### Remove
- Internet Identity popup trigger from the login path (keep II code in place but don't call it during demo login)
- ProfileSetupModal requirement after login (demo login captures name upfront)
- Backend `login()` mutation call from the login flow (not needed for demo)

## Implementation Plan
1. Create `src/frontend/src/utils/demoSession.ts` — helpers to get/set/clear demo session in sessionStorage
2. Rewrite `LoginSelectionModal` — instant form: name input + two role buttons, on submit store session and close
3. Update `App.tsx` — read demo session, skip profile setup modal when demo session is active
4. Update `HomePage.tsx` — use demo session for auth/role detection, no actor dependency for routing
5. Update `Header.tsx` — show name from demo session, logout clears session
