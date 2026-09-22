# Product polish audit

Audit date: 2026-09-21

This is the current implementation record for the autonomous product-polish pass. The older files in `docs/current-state/` remain useful as a historical snapshot from 2026-09-14, but they predate checkpoints 86 and 87.

## Product intent

SkillsGap.gy should help a person move from what they already know to a realistic next step in Guyana:

`experience or direction → confirmed skills → opportunities → gaps → training → application or interview`

The strongest improvements were therefore the ones that make that loop easy to enter, easy to understand, and safe to continue when a service or action fails.

## Improvements shipped

### Public journey

- Replaced the dead-end root page with a real entry point in `src/app/page.tsx`.
- Added consistent public navigation and footer links through `src/components/shareable/public-content-header.tsx` and `src/components/shareable/public-site-footer.tsx`.
- Connected the home page to applicant signup, the no-CV career explorer, public positions, training, and FAQ.
- Replaced stale “coming soon” FAQ copy with current product explanations and useful next links.
- Added specific share labels such as “Share position” and “Share course” so controls announce what is being shared.
- Replaced the detail-page one-link footer with the same public navigation used across the directory.

### Deep links and progression

- Public position CTAs now preserve the role in `/signup?next=/dashboard?roleId=...`.
- The applicant dashboard now shows an explicit four-stage pathway in `src/components/dashboard/pathway-steps.tsx`.
- Applicant navigation now exposes Dashboard, My pathway, Positions, Training, Build a route, and Interviews.
- Fixed the active navigation state so `/dashboard/overview` is not presented as both Dashboard and My pathway.
- Added a context banner when an applicant arrives from a specific position.
- Added global skip navigation and `main-content` landmarks across public, auth, account, error, and setup surfaces.

### Trust and privacy UX

- Match-detail pages now separate applying, private profile sharing, and public position sharing.
- Withdrawal of an application requires an explicit confirmation step.
- Cancelling a direct interview invitation now requires confirmation.
- Direct interview invitations now expire after 14 days, let applicants accept or decline, and show the company when an applicant is interested.
- Removing a confirmed qualification now requires confirmation.
- CV processing copy distinguishes upload, queued, reading, ready, and failure states, including the case where the external processor is not currently available.

### Failure-safe interactions

- Training-plan, interview, slot-booking, application, profile-sharing, consented-CV, work-history, role-management, team-access, qualification-review, and pathway-save actions now recover from thrown requests with user-safe messages.
- Long-running actions expose disabled/busy states to prevent accidental duplicate submissions.
- Publishing a role is disabled until it has at least one requirement, and creating a role validates the title before making a request.
- Share popovers now expose a dialog relationship, return focus on Escape, and move keyboard focus into the first available share action.
- Global focus styles remain visible even on form controls that use `outline-none` for their resting border treatment.

### Visual and content consistency

- Removed symbolic shadows and oversized rounded corners from the career-explorer plan surfaces touched in this pass.
- Standardized touched controls on the project’s `rounded-md` / `rounded-lg` system and color-only transitions.
- Normalized recruiter and team dates through `formatGuyanaDate` so user-facing dates use one Guyana timezone formatter.
- Added rounded card treatment to the home page’s major surfaces without introducing a second visual language.

## Verification

The repository checks completed successfully before and during this pass:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test` — 16 files, 64 tests
- `pnpm build` — 33 application routes
- `go test ./...`, `go vet ./...`, and `go build ./...` from `services/processor`
- Python compilation and OCR validation tests

No browser GUI automation was used; the repository explicitly reserves that for an approved request. No Supabase migration was deployed, and no external service state was changed.

## Deliberate boundaries

- The Go processor remains a private external service. The UI can explain queued/offline behavior, but it cannot make an unavailable processor complete a CV.
- Public position, training, and occupation freshness still depends on the connected Supabase catalogue and its verification workflow.
- A live Supabase/Vercel/processor rehearsal is an environment check, not something a local build can prove. The documented readiness scripts remain the source of truth for that gate.

Confidence in this source-grounded audit: 94%. The remaining uncertainty is external runtime state, not the behavior covered by the local source and automated checks.
