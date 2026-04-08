/**
 * No-op seed hook — seeding is now handled automatically by localStore.ts
 * when getAllIssues() is first called. This hook is kept to avoid import errors.
 */
export function useSeedData() {
  // Seeding happens lazily in localStore.ensureSeeded() on first data access
}
