# SkillsGap.gy demo rehearsal

Run this from the repository root before judging:

```bash
node --env-file=.env.local scripts/setup-demo-users.mjs
node --env-file=.env.local scripts/prepare-demo-fallback.mjs
node --env-file=.env.local scripts/check-demo-readiness.mjs
```

The fallback scenario is deliberately transparent: it uses the curated demo taxonomy and deterministic matching, not a fabricated CV or a claimed AI result. It provides three real database matches, an unmet hydraulic-maintenance gap, and one eligible interview invitation. It starts without company consent so the company view remains anonymized until the applicant shares their profile or books the slot.

## Judge path

1. Open `/login` and choose **Applicant demo**. Show the closest routes and the mechanical-work-to-offshore transfer. Point out the “Curated demo pathway” label and the “Top 3 of 7 roles” count so judges can distinguish rehearsal data from a live vacancy. If using a live CV, pause on **Possible transfers from your CV** and select one taxonomy translation before showing the score; explain that Qwen suggests and the applicant confirms.
2. Open **Trainee Offshore Mechanical Technician**. Explain the deterministic score, BOSIET gate, hydraulic-maintenance gap, and local training route.
3. Open `/interviews` and reserve a 15-minute slot. This confirms the invitation and grants the role-specific consent required by the database trigger.
4. Sign out, choose **Company owner demo**, then open `/company/candidates`. Show that the candidate is anonymized before consent and visible only after the confirmed booking.
5. Sign out, choose **Admin demo**, then use the qualification and training areas to show the governed taxonomy and curated-data labels.

For the logistics scenario, open **Materials Handler / Porter** and show the
mandatory manual-handling and HSE gates alongside optional cargo, warehouse,
rigging, forklift, and first-aid gaps. The role is a curated demonstration;
employer-specific lifting, medical, and access requirements must be verified.

## Live-processing add-on

Once Thunder is healthy, verify the Qwen model identifier and synthetic image/strict-JSON gate, then use a synthetic CV from `services/processor/testdata/generated/`. Every PDF page is rendered and sent to Qwen vision with the extraction prompt; show the applicant upload → processing → evidence-backed review cards → confirmation flow and point out the `vision` evidence method. OCR is not required for this path. If Thunder or Qwen is unavailable, return to the prepared fallback account and say plainly that the live inference demonstration is unavailable while the product’s deterministic, privacy-gated workflow remains live.

Before uploading the fixture, confirm:

- Go `/healthz` returns `{"status":"ok"}`.
- Qwen `/v1/models` reports the exact `VLLM_MODEL` configured for the processor.
- A synthetic page image is accepted with strict JSON output.
- The active processor environment does not require `OCR_SERVICE_SECRET`.

Run the automated private-stack gate (it never prints the API key):

```bash
node --env-file=.env.local scripts/check-vision-only-readiness.mjs
```

After the findings migration is applied, verify the live taxonomy boundary and private finding tables:

```bash
node --env-file=.env.local scripts/check-taxonomy-guided-readiness.mjs
```

The local page-rendering rehearsal is deterministic and does not call Thunder:

```bash
cd services/processor
go test -run 'TestVisionOnlyPipelineRehearsesRepresentativeFixtures|TestRenderedPagesCleanUpAfterRenderFailure' ./...
```

It proves that clean, scanned, mixed, two-column, and table-heavy PDFs all render every page, preserve page order, invoke the vision boundary once, and remove temporary files after a render failure.

## Quick recovery

- Reset a booked fallback slot by rerunning `scripts/prepare-demo-fallback.mjs`; it removes that fallback applicant’s bookings indirectly through the invitation reset, recreates current matches, and recreates the pending invitation.
- If the demo accounts need new credentials, run `scripts/setup-demo-users.mjs` first, then rerun the fallback preparation and readiness checks.
- Do not put `PROCESSOR_URL`, Thunder credentials, or Qwen keys in Vercel. It is optional in `.env.local` only and enables the extra Go `/healthz` assertion.
