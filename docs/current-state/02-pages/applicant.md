# Applicant pages

## Shared shell

Source: `src/app/(app)/layout.tsx:10`

The authenticated shell resolves the current account space and renders a logo link to the account home, desktop navigation, a mobile horizontal navigation row, and a sign-out form. Applicants receive Dashboard, My pathway, and Interviews links. The shell does not render a global back button.

## `/dashboard/overview`

Source: `src/app/(app)/dashboard/overview/page.tsx:10`

Loads `ApplicantProgress`, resolves demo fallback matches when applicable, and renders `ApplicantOverview`. The page contains a hero with the closest route, four snapshot metrics, a four-stage route visualization, closest opportunities, a recommended next step, and momentum/interview links. During processing, it mounts realtime/polling sync.

## `/dashboard`

Source: `src/app/(app)/dashboard/page.tsx:25`

The detailed workspace is the core applicant page:

1. Header with greeting and automatic-update state.
2. CV upload or collapsed “Manage your file” section.
3. Skills review: pending findings, confirmed skills, corrections, years, unmapped private terms, and add/remove controls.
4. Match results: top three approved active roles, score, strengths, gaps, and pathway links.
5. Work history disclosure for editing extracted employment.
6. Saved career-route disclosure or empty save prompt.

Processing and recalculation are represented by status, polling/realtime refresh, and error states. The user can clear the pathway, which removes the CV and derived profile/matches.

## `/matches/[matchId]`

Source: `src/app/(app)/matches/[matchId]/page.tsx:12`

Requires an applicant and loads a current private match or a demo match. It has an explicit `← Back to my pathway`. The detail shows company/role, score, share action, role-specific profile consent, apply/withdraw state, interview-eligibility progress, confirmed strengths, and gaps. The first gap is expanded as “Start here”; remaining gaps are inside a disclosure. Each gap can link to a course, an external training URL, sharing, and plan-start state.

## `/interviews`

Source: `src/app/(app)/interviews/page.tsx:8`

Shows active fair invitations with role, location/date in GYT, and a slot-booking form, or direct invitations with a 14-day response window. Applicants can accept or decline a direct invitation; their name and CV remain private until they separately share their profile. Empty state links back to the detailed dashboard. There is no explicit back action when invitations exist.

## Current UX observations

The applicant flow has strong product logic but two dashboard surfaces: overview and detailed pathway. The persistent nav distinguishes them only as “Dashboard” versus “My pathway”; the detailed page can become long because it contains upload, review, matches, work history, and saved route. Disclosure elements help, but the page still asks the user to parse many states in one place.
