# `/dashboard`

Source: `src/app/(app)/dashboard/page.tsx:25`

Applicant-only detailed pathway. It sequences private CV upload, processing, evidence-backed skill review, confirmed profile edits, top-three matches, work-history edits, and saved career-route display. Realtime/polling refreshes active processing. `?pathway=saved` shows a save confirmation.

Back: authenticated shell navigation only; no explicit overview/back link inside the page. This is the densest applicant surface.
