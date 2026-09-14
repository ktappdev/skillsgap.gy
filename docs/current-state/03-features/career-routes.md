# No-CV career routes

Sources: `src/components/i-want-to-become/`, `src/lib/i-want-to-become/`, `src/app/api/i-want-to-become/`

## Catalogue types

- Guided starter routes are hard-coded in `src/lib/i-want-to-become/catalog.ts` and include CSEC/CXC-oriented requirements.
- Occupation routes are seeded in Supabase and mirrored by a static local catalogue fallback. They carry ISCO-08 identity, role family, value-chain stages, local-content categories, example titles, source metadata, and transfer summaries.

## Local state

The explorer draft is stored in `sessionStorage`. Occupation action completion is stored per pathway in session storage. A save handoff is stored in `localStorage` for up to 24 hours and is validated before use. Slip photos are previewed with an object URL and are not persisted.

## Public data fallback

The occupations list and occupation pathway API routes validate RPC response shapes. If Supabase is unavailable or malformed, they return the static catalogue/pathway with a `fallback` source marker. Cache headers are five minutes with stale-while-revalidate for one hour.

## Saving

Applicant saves are upserted by applicant ID and contain pathway kind/key/title, interests, selected interests, CSEC/CXC results, planned requirement names, and completed action IDs. Save validation rechecks the route against the current canonical guided catalogue or public occupation pathway before writing.

## Current risks

- Guided content lives in code while occupation content has live and static sources; they can drift.
- The user’s route plan is private planning data, not a qualification or match input. The UI communicates this, but the difference must remain explicit in any redesign.
