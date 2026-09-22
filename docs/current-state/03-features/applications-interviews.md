# Applications, consent, and interviews

Sources: `src/lib/skillsgap/actions.ts`, `src/app/(app)/matches/[matchId]/page.tsx`, `src/app/(app)/interviews/page.tsx`, `src/app/(app)/company/candidates/page.tsx`

## Applicant actions

- Apply is allowed only for an active role where the applicant has a current match at or above the role threshold. The application is recorded as `applied` and can later be withdrawn/reapplied.
- Profile sharing is role-specific. It creates or reactivates `candidate_consents` for that company/role. Revocation sets the consent to `revoked`.
- Interview slot booking inserts a confirmed booking. Unique constraints surface a “slot was just taken” error.

## Company actions

- Company members see current matches for their active roles.
- Candidate identity and CV are hidden until role-specific consent.
- A company can view a temporary ten-minute signed CV URL only after the secure consent RPC authorizes it.
- Direct interview invitations require an active application, are role-specific, and are separate from profile consent.
- Job fairs have a lifecycle and 15-minute slots. Database triggers invite eligible candidates when a fair opens; applicants can book one of the active slots.

## Applicant interview page

The page distinguishes fair invitations from direct invitations. Fair invitations expose date/location and booking; direct invitations expire after 14 days, let applicants accept or decline, and do not automatically reveal identity/CV. Companies see accepted and declined direct-invitation states; expired invited rows can be renewed.

## Current risks

- “Apply”, “Share profile”, and “Interview” are related but separate state machines. The current UI exposes them across match detail, company candidates, and interviews, which can be hard to explain to a first-time user.
- No visible applicant-facing consent-management page exists; revocation is an action on match detail.
