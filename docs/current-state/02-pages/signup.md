# `/signup`

Source: `src/app/(auth)/signup/page.tsx:15`; UI: `src/components/auth/auth-form.tsx`

Creates the default applicant account with email, password, optional full name, and optional username. Authenticated users are redirected to their account home. Email confirmation returns through `/auth/callback`; immediate sessions go to the safe `next` path or dashboard. When arriving from career-route saving, the `next` path points to the save handoff.

Back: logo → `/`; no contextual cancel control.
