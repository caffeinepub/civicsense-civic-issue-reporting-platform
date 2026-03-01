# Specification

## Summary
**Goal:** Fix the bug in `HomePage.tsx` where authenticated users (municipal staff/admin and citizens) are incorrectly shown `PublicPortal` instead of their role-appropriate portal.

**Planned changes:**
- Fix the conditional rendering logic in `HomePage.tsx` so that authenticated municipal staff/admin users see `MunicipalPortal`, authenticated citizens see the citizen-facing view, and only unauthenticated users see `PublicPortal`.
- Audit `LoginSelectionModal.tsx` to ensure the user's role is correctly written to `sessionStorage` after a successful login, and that `HomePage.tsx` reads the same `sessionStorage` key for portal selection.
- Ensure the existing sessionStorage flash-prevention guard continues to work correctly during auth loading, with no flicker to `PublicPortal` for authenticated users.

**User-visible outcome:** After logging in, municipal staff/admin users are taken to `MunicipalPortal` and citizens see their appropriate view, with no incorrect redirect to `PublicPortal`.
