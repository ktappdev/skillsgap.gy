# Applicant CV and profile feature

Sources: `src/components/skillsgap/cv-upload.tsx`, `src/lib/skillsgap/actions.ts`, `src/lib/skillsgap/queries.ts`

## Upload

The browser validates PDF type and a 15 MB maximum, creates a user-scoped random Storage path, and uploads directly to the private `resumes` bucket. It then calls `queueResumeProcessing`, which validates ownership/path, prevents a second active CV, inserts the `resumes` row, inserts a queued `resume_analysis` job, and marks onboarding complete.

The UI distinguishes local upload, waiting, queued/reading, ready, and error states. It explains that the upload is private and that the user can leave while processing. Realtime subscriptions plus a five-second refresh interval keep the dashboard current while work is active.

## Processing result

The processor returns qualification findings and employment facts. The database stores findings as pending and work history as applicant-private. The browser never treats model suggestions as confirmed skills.

## Review and corrections

Applicants can:

- Choose one of up to two candidate taxonomy qualifications for a finding.
- Confirm selected findings in one action.
- Dismiss a finding.
- View evidence, page, method, original term, and confidence.
- Edit years of experience.
- Correct a confirmed qualification to another active taxonomy entry.
- Add a missing qualification manually.
- Remove a qualification.
- Edit extracted work title, employer, and years.

Only confirmed qualifications participate in matching. Confirming skills computes optimistic match gains for the user, then the database recalculation becomes authoritative.

## Reset

Clearing the pathway is a broad destructive action: it removes uploaded Storage files and resets derived applicant records through `clear_applicant_pathway`. The UI warns that the skills, history, and matches created from the CV are also cleared.

## Current risks

- The user must understand the distinction between “CV read”, “suggestion”, and “confirmed skill” from copy and disclosures spread down a long page.
- The one-active-CV rule means replacement is a reset flow rather than a simple upload replacement.
- If the worker is offline, the UI correctly stays in a waiting/error state, but the root product has no clear operational status surface.
