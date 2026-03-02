# Specification

## Summary
**Goal:** Auto-fetch the user's location when the Report Issue dialog opens, and hide the Report Issue feature from the Municipal portal.

**Planned changes:**
- In `ReportIssueDialog.tsx`, trigger the browser Geolocation API automatically when the dialog opens to pre-fill the location fields.
- If geolocation succeeds, populate the latitude/longitude (and address if reverse-geocoded) without user interaction.
- If geolocation is denied or fails, keep the location field editable and show an inline error message.
- Conditionally hide the Report Issue button and `ReportIssueDialog` in the Municipal (operator) portal view based on the user's role.
- Ensure the Report Issue entry point remains visible and functional for citizens and unauthenticated public users.

**User-visible outcome:** Citizens see their location auto-filled when opening the Report Issue dialog, while municipal operators no longer see or can access the Report Issue button or dialog.
