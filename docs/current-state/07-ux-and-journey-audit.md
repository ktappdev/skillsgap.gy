# UX and complete-journey audit

This is an evidence-based inventory of the current journey, with particular attention to back behavior, progressive disclosure, and screen density.

## Journey A: first-time applicant from the public root

Current path: `/` → `/faq` only.

The root does not expose a start CTA, sign-in, signup, career explorer, public positions, or public training. The FAQ also returns only to the root. The authenticated journey is therefore discoverable only through a direct URL or an external link.

**Gap:** the public funnel is not connected to the implemented product.

## Journey B: no-CV career exploration

Current path: `/i-want-to-become` → three steps → route plan → optional signup/login → `/dashboard?pathway=saved`.

This is the strongest current flow. Back is visible between steps, progress is clickable once unlocked, drafts are restored, and route plans can be edited.

**Gap:** live occupation data and static fallback data create two content sources; save errors can return a user to rebuild even though a browser draft may still exist.

## Journey C: applicant CV to match

Current path: signup/login → `/dashboard/overview` or `/dashboard` → upload → waiting/reading → review → confirm → recalculation → match detail → gap/course/apply/share/interview.

The logic is solid and privacy-aware. The detailed dashboard contains many distinct jobs: file management, evidence review, qualification editing, matching, work-history editing, and saved-route display.

**Gap:** there is no single, explicit stepper for the CV path. The user learns the sequence from headings, status cards, and vertical order.

## Journey D: applicant to interview

Current path: match detail → apply (threshold gate) and/or share profile → company sees application → direct invitation or job-fair invitation → `/interviews` → book slot.

The state machine is more nuanced than the UI wording: applying does not share identity; consent is separate; direct invitations require an active application; fair invitations are database-triggered by eligibility and fair state.

**Gap:** the UI does not provide a compact explanation of these relationships at the moment a user decides what to do.

## Journey E: company onboarding

Current path: `/signup/company` → `/company/request-access` → pending → admin approval → `/company` → roles → candidates → fairs/team.

**Gap:** approval is an external waiting state with no notification/status navigation beyond the request page; the public root does not explain how a company enters this route.

## Journey F: provider onboarding

Current path: `/signup/provider` → `/provider/setup` → pending provider → admin verification → `/provider/programs` → public course visibility.

**Gap:** verification, program active state, outcome mapping, and public visibility are separate concepts and are easy to conflate in the dense management screen.

## Back-button inventory

Explicit contextual back links exist on:

- Match detail → `/dashboard`.
- Public position detail → `/opportunities`.
- Public course detail → `/training`, plus applicant-specific back to dashboard.
- Company access request → `/`.
- Recruiter invitation → `/`.
- Provider setup → `/` via logo only.
- Career explorer → step back, editable progress, and plan edit.
- Interviews empty state → `/dashboard`.

The authenticated shell has no global back control. Company/provider/admin pages rely on secondary navigation and the logo. Error and not-found pages return to `/`, which currently exits the user to the coming-soon surface.

## Density inventory

High-density surfaces:

- `/dashboard`: multiple long sections and disclosures.
- `/provider/programs`: program editing, outcome search, mapping, and qualification creation.
- `/admin/career-guidance`: occupation selector plus summary, subjects, action editor, and action list.
- `/admin/training`: provider/program/outcome creation and verification.
- `/company/jobs`: role creation plus per-role requirement editors.
- `/company/job-fairs`: fair creation plus per-fair slot management.

Lower-density surfaces:

- `/i-want-to-become` while one explorer step is active.
- Public position/course detail pages.
- Applicant match detail, although it combines several decision types.

## Accessibility foundations already present

The code uses semantic headings, fieldsets/legends in the explorer, labels, `aria-current`, `aria-live`, `role="alert/status"`, keyboard-focus styles, native details disclosures, and minimum 44px-ish interactive heights in many places.

## Rebuild priorities suggested by the current state

1. Reconnect the public root to the real start paths.
2. Make the applicant journey an explicit sequence with one primary action per state.
3. Preserve contextual back/return behavior for every deep link and error state.
4. Separate public-link sharing from private profile consent in copy and visual treatment.
5. Split dense management screens by task while keeping domain components composable.
6. Add an operational “processing unavailable / queued” explanation that does not pretend the model is running.
