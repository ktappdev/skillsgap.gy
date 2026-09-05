# SkillsGap.gy demo rehearsal

Run this from the repository root before judging:

```bash
node --env-file=.env.local scripts/setup-demo-users.mjs
node --env-file=.env.local scripts/prepare-demo-fallback.mjs
node --env-file=.env.local scripts/check-demo-readiness.mjs
```

The fallback scenario is deliberately transparent: it uses the curated demo taxonomy and deterministic matching, not a fabricated CV or a claimed AI result. It provides three real database matches, an unmet hydraulic-maintenance gap, and one eligible interview invitation. It starts without company consent so the company view remains anonymized until the applicant shares their profile or books the slot.

## Judge path

1. Open `/login` and choose **Applicant demo**. Show the closest roles and the mechanical-work-to-offshore transfer.
2. Open **Trainee Offshore Mechanical Technician**. Explain the deterministic score, BOSIET gate, hydraulic-maintenance gap, and local training route.
3. Open `/interviews` and reserve a 15-minute slot. This confirms the invitation and grants the role-specific consent required by the database trigger.
4. Sign out, choose **Company owner demo**, then open `/company/candidates`. Show that the candidate is anonymized before consent and visible only after the confirmed booking.
5. Sign out, choose **Admin demo**, then use the qualification and training areas to show the governed taxonomy and curated-data labels.

## Live-processing add-on

Once Thunder is healthy, use a synthetic CV from `services/processor/testdata/generated/`. Show the applicant upload → processing → evidence-backed review cards → confirmation flow. If Thunder is unavailable, return to the prepared fallback account and say plainly that the live inference demonstration is unavailable while the product’s deterministic, privacy-gated workflow remains live.

## Quick recovery

- Reset a booked fallback slot by rerunning `scripts/prepare-demo-fallback.mjs`; it removes that fallback applicant’s bookings indirectly through the invitation reset, recreates current matches, and recreates the pending invitation.
- If the demo accounts need new credentials, run `scripts/setup-demo-users.mjs` first, then rerun the fallback preparation and readiness checks.
- Do not put `PROCESSOR_URL`, Thunder credentials, or Qwen keys in Vercel. It is optional in `.env.local` only and enables the extra Go `/healthz` assertion.
