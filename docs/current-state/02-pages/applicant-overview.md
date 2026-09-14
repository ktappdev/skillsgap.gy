# `/dashboard/overview`

Source: `src/app/(app)/dashboard/overview/page.tsx:10`; UI: `src/components/dashboard/applicant-overview.tsx`

Applicant-only summary dashboard. Loads progress and demo fallback state, then shows a hero/closest route, metrics for confirmed skills/routes/highest match/priority gaps, a four-stage pathway, top matches, recommended next step, and momentum/interview CTA. While processing, realtime sync is mounted.

Back: authenticated shell navigation only; no contextual back link.
