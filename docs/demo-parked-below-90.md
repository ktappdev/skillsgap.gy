# Demo remedies — all cleared above 90% (verified 2026-09-06 morning)

These three items initially scored under 90%. Follow-up research cleared all of them:
P1 live Qwen probe (96) · P2 confirm→recalc trace (91) · P3 provider live-create checks (94).
Stage guidance for each is below.

## P1 — Controlled 1-page CV wording (score: 96 — CLEARED by live Qwen probe 2026-09-06)

**Why cleared:** Two identical live probes against Qwen (`VLLM_MODEL=qwen3.6-35b`, production-style system prompt + fresh 63-slug taxonomy snapshot + 1 synthetic page image, strict JSON schema, temperature 0) both returned 7 findings, 4 employment rows, 0 unmapped terms, ~15s latency. Every safe phrase mapped to the expected slug on both runs — deterministic output, no variance.

Live probe results (both runs identical):
- `Minibus diesel repair` → [diesel-mechanics] yrs=4 conf=0.95
- `Generator repair and mechanical maintenance` → [mechanical-maintenance] yrs=1 conf=0.95
- `Forklift Driver` → [forklift-operations] yrs=1 conf=0.95
- `Porter - warehouse materials handling and safe lifting` → [manual-handling-and-lifting, warehouse-operations] yrs=0 conf=0.95 (2-slug ambiguity, applicant picks one on stage)
- `Hydraulics Maintenance` → [hydraulic-maintenance] yrs=0 conf=0.95
- `Workshop health and safety` → [hse-awareness] yrs=0 conf=0.95
- `Storekeeper - inventory control` → [warehouse-operations] yrs=0 conf=0.95

**Remaining caveat (minor, script around it):** The Porter line returns 2 candidate slugs, so the judge must click one translation before the score moves — that IS the demo moment (Qwen suggests, applicant confirms). Years come back as stated or 0; the applicant edits years in the UI, which is also scripted.

**Do not claim on stage:** H2S, Secondary Education, Driver's licence, SEO, Google Analytics, Advanced Excel, BOSIET with CA-EBS. Only `bosiet` exists; the rest have no slug and can never score.

**Note:** `Porter` (bare) → `manual-handling-and-lifting`, but `Hotel Porter` → `accommodation-services` — keep the CV wording as probed. Lock the exact PDF bytes used on stage; never reword.

## P2 — Pending findings confirm → recalc timing (score: 91 — CLEARED by end-to-end trace 2026-09-06)

**Why cleared:** Traced the full chain in code + live DB config:
- `confirm_extraction_finding()` RPC (`20260905205816_persist_extraction_findings.sql:282`) writes `applicant_qualifications:confirmed` **synchronously** in the same call and flips the finding to `confirmed` — the click itself never hangs.
- The `applicant_qualifications_enqueue_recalculation` trigger (`20260904210003_skillsgap_domain.sql:657`) only enqueues a `recalculate_matches` job; it does not block the UI.
- Thunder poller picks up queued jobs every 20s (`services/processor/service.go:37`, `config.go:37`) and `apply_match_recalculation` recomputes deterministically.
- UI: `qualification-review.tsx:confirmFinding` removes the card instantly, shows "Translation confirmed. Your role matches are being recalculated.", and calls `router.refresh()`; `realtime-sync.tsx` subscribes to `job_matches` + `resume_extraction_findings` so the score updates without manual refresh.

**Stage script (the wait is a feature, not dead air):** click Confirm → narrate "Qwen suggests, you confirm, Postgres recalculates — watch the score move" → score follows within ~20–60s via Live sync. If Realtime shows offline, one manual refresh after ~30s covers it.

## P3 — Provider creates qualification live on stage (score: 94 — CLEARED by live DB + code checks 2026-09-06)

**Why cleared:**
1. GTI row verified live: `Government Technical Institute`, `is_verified=true`, `owner_user_id` linked to `demo-provider@skillsgap.gy` (relinked by `setup-demo-users.mjs` this morning) — the verified-only guard passes.
2. RLS policy `20260906020000_allow_provider_qualification_creation.sql` allows verified-owner inserts with `is_active=true`; `createProviderQualification` auto-slugs, inserts active, and maps the outcome to the provider's program in one action, with a friendly 23505 message on slug collision.
3. No processor restart needed: `store.go:loadTaxonomy` pulls a **fresh** `get_active_extraction_taxonomy()` snapshot on every job, so a provider-created slug is visible to the very next CV processed.

**Stage rule:** pick a novel name (e.g. "Solar PV Basics") to avoid the duplicate-slug error. The residual risk is only a name collision, which surfaces a readable error — have the backup name ready.

## Local-only note — Go render rehearsal fails on this Mac (not a Thunder blocker)

`go test -run TestVisionOnlyPipelineRehearsesRepresentativeFixtures` fails locally with "This PDF is locked or damaged" because `pdfinfo`/`pdftoppm` (poppler) are not installed on this Mac (`command -v pdfinfo` → missing, `brew list poppler` → no keg). Thunder vision readiness (`check-vision-only-readiness.mjs` → "passed for qwen3.6-35b") and taxonomy readiness (63 active qualifications) both pass against the live stack. Fix locally with `brew install poppler` when convenient; do not treat as a stage blocker.

## Verified state after the 90%+ pass (2026-09-06 morning)

- Thunder vision gate: PASSED (`check-vision-only-readiness.mjs`).
- Taxonomy gate: PASSED (63 active qualifications, private RPC + finding tables).
- Fallback applicant: 7 current matches; top = Trainee Offshore Mechanical Technician 82% (14/17 weight, mandatory met, threshold 75, eligible true). Only gap on the top match is `hydraulic-maintenance`, which HAS a verified GTI outcome.
- Other roles recomputed live: Hydraulic Maintenance Assistant 36%, Offshore Electrical Trainee 36%, all others 0% — matches DB exactly.
- Demo readiness: PASSED — five logins, ≥3 matches, 1 eligible, 1 pending invitation.
- Consent: 0 rows (company view anonymized before booking).
- Fair `50000000-0000-0000-0000-000000000001`: open, future-dated, 16 slots, 16 open, 1 pending invite on offshore mech tech.
- Labels: `Curated demo pathway` vs `Company-published role` in `match-card.tsx` + `matches/[matchId]`; `Top N of M roles` in `dashboard/page.tsx` via `visibleRoleCount`.
- Morning reset: `setup-demo-users.mjs` → `prepare-demo-fallback.mjs` → `check-demo-readiness.mjs`. Added missing `DEMO_PROVIDER_EMAIL/PASSWORD` to `.env.local` (local-only, never commit).
