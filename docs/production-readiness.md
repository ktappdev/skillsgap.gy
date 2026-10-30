# Production readiness checklist

Recon date: 2026-10-30. Six read-only agents reviewed the repo in parallel: web security, database, Go processor, engineering hygiene, UX and front end, and deploy and ops. Findings below are merged and deduplicated. Source IDs (`SEC-`, `OPS-`, `ENG-`, `DB-`, `PRO-`, `UX-`) are kept in brackets so the original reasoning can be traced.

**Priority:** P0 = fix before real users. P1 = fix soon after, or before launch if time allows. P2 = polish.
**Effort:** S = under half a day. M = about a day. L = multiple days.

**Verification status:** Only the missing `src/proxy.ts` was independently confirmed by hand (and by two agents). Everything else is agent-reported with file evidence. Re-check the claim before starting each item, especially anything marked *(unverified)*. The database pass was shallow: it found little, which is not proof the schema is clean.

**Decision already made:** `services/ocr` is an unused fallback and is safe to delete (see item 0.1).

---

## Status after the autonomous pass (2026-10-30)

Done and verified locally: typecheck, lint, 392 tests, `go vet`/`go test`, and `pnpm build` all pass. Done items are ticked below. Checkpoints 163 to 167 hold the changes.

Left unticked on purpose. Each of these needs a decision from the owner, a database change, a new dependency, or a live deploy, which an unattended pass should not guess at:

- **0.2 upgrade `next`:** needs `pnpm install`, which AGENTS.md says not to run unasked. Do this first; it clears a critical advisory.
- **0.4 duplicate binaries:** left alone because they may be deliverables.
- **0.5 stale refs:** partly done. `AGENTS.md`, the README and the runbooks pointed at the old Supabase ref `uljznzafpiamxmervxjb`; they now match `supabase/config.toml` and `.env.local` (`uoaudfdaffnlrjwqnnnq`). The test counts in the two docs are refreshed.
- **0.6 `[pdbg]` logging:** most of these are real `console.error` calls in catch blocks that tests assert on, so they stay. The processor's `PICODE_DEBUG` is now `SKILLSGAP_DEBUG`.
- **0.7 shared fallback skills:** the scripts and `PROCESSOR_URL` are done; the shared skills list is not.
- **1.1 to 1.7, 1.9, and sections 2.1 to 2.3, 2.5 to 2.9:** legal copy, demo and production separation, retention, deletion, and anything needing a migration or a rate-limit store.
- **3.2, 3.6, 3.8, 3.9, 3.13:** retry backoff (migration), `/readyz`, container deploy, host move, and webhook HMAC.
- **4.x, 5.1 to 5.3, 6.2, 6.3:** SQL test runner, error tracking, email, wider tests, dependency bumps.

Notes on what was done:

- **1.8 proxy:** `src/proxy.ts` now refreshes the Supabase session. The old root `proxy.ts` removed in `cd2d267` was a launch-time redirect gate, not session refresh, so `updateSession` was never wired in at all.
- **2.4 headers:** `nosniff`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, and no `X-Powered-By`. A CSP is deferred until it can be browser-tested against auth and uploads.
- **6.1 CI:** written but never run on GitHub. It skips `pnpm build` and uses placeholder public env values.
- **7.1:** no share image was added; there is none in the repo.

---

## 0. Cleanup and quick wins

- [x] **0.1 Delete `services/ocr`** (S). Remove the directory, the Python syntax and unittest commands from `AGENTS.md`, and any docs that mention it. Confirm nothing in `scripts/` or CI references it.
- [ ] **0.2 Upgrade `next` to at least 16.3.8** (S). `pnpm audit --prod` reports 13 advisories, including a critical RCE in `next/og` (the app does not import it) and a high image-optimization SSRF. Re-run audit and the full check suite after. [ENG-3]
- [x] **0.3 Delete dead code** (S). `src/lib/format.ts` (`formatDate` is unused). Check whether `src/lib/company/access-request.ts` is used at runtime; if only its test imports it, delete both. [ENG-10]
- [ ] **0.4 Remove duplicate binaries** (S). `skillsgap-features.png` at the repo root and `docs/skillsgap-demo-end-card.png` are byte-identical, about 1.2 MB each. `skillsgap-manual.docx` is unreferenced. Keep one copy in `docs/`. [ENG-12]
- [ ] **0.5 Fix stale docs and config** (S). `docs/current-state/08-verification-and-open-issues.md` and `docs/polish-audit.md` say 16 files and 64 tests. The actual run is 56 files and 390 tests. `supabase/config.toml` `project_id` is `uoaudfdaffnlrjwqnnnq` but AGENTS.md names the linked ref `uljznzafpiamxmervxjb`. Confirm which is intended and align them. [ENG-9, DB-2]
- [ ] **0.6 Replace `[pdbg]` console logging** (S). 25 `console.*` calls, some ungated by `NODE_ENV`. Use one logger that is off in production. Rename the processor's `PICODE_DEBUG` to a project-named flag. [ENG-13]
- [ ] **0.7 Deduplicate demo fallback skills and script wiring** (S). The seven-skill list lives in both `scripts/prepare-demo-fallback.mjs` and `src/lib/skillsgap/actions.ts`. Export from one module or add an equality test. Add `package.json` scripts for the four undiscoverable scripts. Add `PROCESSOR_URL` to `.env.example`. [ENG-11]
- [x] **0.8 Drop the duplicate webhook check from the `test` script** (S). It already runs inside vitest. Add `vitest --coverage`. [ENG-15]

---

## 1. Launch blockers (P0)

- [ ] **1.1 Privacy policy, terms of service, and CV-retention statement** (M). No `/privacy` or `/terms` route exists, yet the core action is uploading a CV (personal data). State what is stored, where it is processed (including the model call), how long it is kept, and how to delete it. Decide and document the monetization position. [OPS-1]
- [ ] **1.2 Separate demo from production data** (M). Demo users, a demo platform admin, and 8 fake "approved" companies from `supabase/seed.sql` all live in the same database real users would sign into. Before launch: provision a clean production database without the demo chain, or tear the demo accounts down (`--teardown` exists). Add `companies.is_demo` and filter listings by it, as roles already do. Keep demo on a separate project. [OPS-2, OPS-14]
- [ ] **1.3 Fix demo provisioning defaults in `scripts/reset-db.mjs`** (S). Agent reports the demo chain auto-runs on every production trash (`reset-db.mjs:289`) and forwards `--force` into admin provisioning. Make demo opt-in via `--with-demo` and make `--force` per-script. *(unverified)* [OPS-2, OPS-8]
- [ ] **1.4 Add a second barrier to one-click demo login** (S). `signInAsDemo` is gated only by the build-time `NEXT_PUBLIC_DEMO_LOGIN_ENABLED` flag. Refuse it when the site URL is the production origin, or require a server-side host allow-list. Rotate `DEMO_*` passwords. [SEC-3]
- [ ] **1.5 Document and script creating the first real platform admin** (S). Today the only path is the demo setup script or direct SQL. [OPS-12]
- [ ] **1.6 Applicant "delete my data" and data export** (M). No account-deletion or export path exists. Delete CV objects, processing jobs, findings, qualifications, matches, and consents, then the auth user, behind a confirmation step. [SEC-10]
- [ ] **1.7 Retention for description text** (S/M). `processing_jobs.input_text` holds applicant-written personal data indefinitely. Clear it after processing or expiry. [DB-1]
- [x] **1.8 Re-add `src/proxy.ts` for Supabase session refresh** (S). **Confirmed missing.** `updateSession` in `src/lib/supabase/proxy.ts` is never imported. The proxy was removed in commit `cd2d267` ("139: remove the retired root proxy gate") but AGENTS.md still requires it. Server components swallow cookie writes, so rotated refresh tokens can be lost and returning users get silently logged out. Add `src/proxy.ts` with a static-asset exclusion matcher, add a test, then verify with a login older than an hour. Update AGENTS.md if the design intentionally changed. [SEC-1, ENG-1]
- [ ] **1.9 Hide the demo launch banner and gate the hard-coded demo match fallback** (S/M). The "Demo mode" notice is mounted in the root layout on every route. `src/lib/skillsgap-demo.ts` shows fixed roles, scores, and costs when an account has no matches. Make both conditional on a server-side deployment setting that defaults to off in production. [UX-1, UX-2, UX-6]

---

## 2. Security and abuse

- [ ] **2.1 Durable rate limit and daily cap for the anonymous result-slip endpoint** (M). `src/app/api/i-want-to-become/slip/route.ts` uses an in-memory `Map` keyed by IP, which resets on every serverless cold start, has no global cap, and grows without bound. It forwards up to 8 MB to the vision model. Move to a Postgres quota like `consume_skill_preview`. [SEC-2, OPS-6]
- [ ] **2.2 Stop trusting the leftmost `x-forwarded-for`** (S). Use the platform's trusted header. Affects the slip route and `skill-preview.ts`. [SEC-8]
- [ ] **2.3 Per-applicant daily cap on `resume_analysis` and `description_analysis` jobs** (M). Upload, process, clear, repeat is unthrottled and each pass costs a vision call. Also verify the storage object (size, mimetype, magic bytes) server-side instead of trusting client `byteSize`. [SEC-6, OPS-11]
- [x] **2.4 Add security headers** (S). `next.config.ts` is empty. Add CSP (Supabase origin in `connect-src`), `frame-ancestors 'none'`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `poweredByHeader: false`. Test auth and upload flows afterward. [SEC-4, ENG-8, OPS-9]
- [ ] **2.5 Move the demo reset password out of source** (S). `demoResetPassword = "reset1"` is hardcoded in `src/lib/skillsgap/actions.ts`. Read from a server-only env var and look the applicant up by ID instead of paginating `listUsers()`, which breaks past 50 users. [SEC-5]
- [ ] **2.6 Cap anonymous `pathway_plan_handoffs` writes** (S). Unauthenticated inserts of 16 KB can outrun the prune job, which deletes 100 rows per 5 minutes. Add a per-IP/global daily cap and prune by age. [SEC-7]
- [ ] **2.7 Audit log for employer CV access** (M). Record applicant, role, company, member, and time before issuing a signed CV URL. Show the ledger to the applicant. [SEC-9]
- [ ] **2.8 Add `company_id` predicates to company mutations** (S). `cancelDirectInterview`, `addInterviewSlot`, and `openJobFair` rely only on RLS for tenant scoping. Defense in depth. [SEC-11]
- [ ] **2.9 Review CV read policy interaction** (S). Owner and consent policies combine with OR; confirm the effective policy state after all migrations matches intent. [DB-3]

---

## 3. Processor reliability (Go)

- [x] **3.1 Check Poppler at startup and treat a missing binary as transient** (S). A host without `pdfinfo` on `PATH` marks every CV as terminally failed and tells applicants their PDF is damaged. Use `exec.LookPath` in `loadConfig` and refuse to boot. **Highest-impact processor item.** [PRO-1]
- [ ] **3.2 Retry backoff** (M). Three attempts burn in about 20–40 seconds. Add `next_attempt_at` to `processing_jobs`, set it in `fail_processing_job`, and filter on it in the poller and `claim_processing_job`. [PRO-2]
- [x] **3.3 Classify model errors** (S). Return the status code from `llm.go`. Treat 400/401/403/404/413/422 as terminal with a distinct message and 429/5xx as transient. [PRO-3]
- [x] **3.4 Worker concurrency** (S). One worker means one slow CV stalls the whole queue. Add `WORKER_CONCURRENCY` (default 2–4). Claiming already provides exclusion. [PRO-4]
- [x] **3.5 Bound PDF render dimensions** (S). `pdftoppm -r 144` with no size cap lets a huge `MediaBox` consume multiple GB before the byte guard trips. Add `-scale-to` and run under a memory cap. [PRO-5]
- [ ] **3.6 Real readiness endpoint** (M). `/healthz` is a static `ok`. Add `/readyz` that checks Supabase, the model endpoint, and Poppler, cached about 30 seconds. [PRO-6, ENG-7]
- [x] **3.7 Graceful shutdown** (M). The terminal `fail` write runs on an already-cancelled context, so a restart strands the job in `processing` for 15 minutes. Use `context.WithoutCancel` for terminal writes and consider releasing owned rows on SIGTERM. [PRO-7]
- [ ] **3.8 Reproducible deploy** (M). pm2 plus `go build` from the working tree, no Dockerfile, no TLS config in the repo. Add a Dockerfile or systemd unit, build in CI, commit the proxy snippet, and add `services/processor/.env.example`. [PRO-8, OPS-15]
- [ ] **3.9 Move off the personal tunnel URL** (M/L). The webhook migration hardcodes a Thunder Compute forwarding URL, and the whole CV pipeline depends on one rented GPU box. Use a stable domain, an uptime check on the health endpoint, and an alert when jobs stay `queued`. [OPS-4]
- [x] **3.10 Fail fast on unknown job kinds** (S). Use an explicit `switch` with a terminal default so a new kind does not run the CV path. [PRO-9]
- [x] **3.11 Log only PostgREST `code` and `message`** (S). Verbatim upstream bodies can echo CV-derived values into logs. Read `CF-Connecting-IP` only from trusted proxies. [PRO-10]
- [x] **3.12 Tests for the job lifecycle** (M). Coverage is 69.9% but `service.process`, `worker`, and `poller` are untested. Add a fake store and table-driven tests. Do this alongside 3.2, 3.7, and 3.10. [PRO-11]
- [ ] **3.13 Harden the webhook auth** (S). Static shared secret with no rate limit or replay window. Use an HMAC with a timestamp window, or at least a token bucket plus a documented rotation procedure. [PRO-12]

---

## 4. Database and data

- [ ] **4.1 Run `supabase/tests/*.sql` automatically** (M). Four SQL test files (695 lines) are never executed. `apply_match_recalculation` (score and mandatory gate) and several security-definer RPCs have no tests. Add a local `supabase start` runner and a scoring test. [ENG-5]
- [ ] **4.2 Readiness check for Vault secrets** (S). Assert both webhook secrets exist and log when the poller fallback takes over. A missing URL currently only raises a warning. [OPS-10]
- [ ] **4.3 Mandatory backup before production trash** (S/M). `--backup` is opt-in. Require it, enable PITR, and write and test a restore procedure. [OPS-3]
- [ ] **4.4 Migration map for high-risk functions** (S). Processing and matching functions are redefined across several migrations. Keep a short doc of the effective definition. [DB-4]

---

## 5. Observability, ops, and email

- [ ] **5.1 Error tracking and a web health route** (M). No Sentry or equivalent, `error.tsx` never reports its `digest`, and the Next app has no health endpoint. Add a reporter and a job-lag alert on `processing_jobs` (`queued` too long). [ENG-7, OPS-7]
- [ ] **5.2 Configure email** (M). Auth email uses the Supabase built-in sender (rate-limited, weak deliverability). Set up custom SMTP with a domain-owned sender. Decide whether company approval and team invitations notify by email or stay link-copy only. [OPS-5]
- [ ] **5.3 Warn on wrong `NEXT_PUBLIC_SITE_URL`** (S). Add a startup warning when it is not the canonical host, and make the Supabase auth allow-list update a deploy-runbook checkbox. [OPS-13]
- [x] **5.4 Runbooks and onboarding** (M). README has no install, env, or commands section. Add `docs/runbooks/` for deploy and promote-preview, rollback, secret rotation (webhook secret, Vault, service-role key), and demo reset. [ENG-6]

---

## 6. Testing and CI

- [x] **6.1 Add CI** (M). There is no `.github/`. Add a workflow running `pnpm install --frozen-lockfile`, typecheck, lint, test, and build, plus `go vet` and `go test`. Add `govulncheck` and a secret-gated job for the Supabase dry-run and lint. Today typecheck, lint, test, and `go test` all pass locally. [ENG-2]
- [ ] **6.2 Tests for core flows** (M). `src/lib/skillsgap/actions.ts` (1,380 lines), `queries.ts`, `provider-actions.ts`, profile, company, and pathway actions have no tests. Prioritize the CV confirm and reject loop, apply and withdraw, and dashboard top-three ranking. [ENG-4]
- [ ] **6.3 Patch and minor dependency bumps** (S). `react`, `@supabase/supabase-js`, and similar. Plan majors (TypeScript 7, vitest 5, eslint 10) separately once CI exists. [ENG-14]

---

## 7. Product and UX

- [x] **7.1 Open Graph and Twitter metadata** (S). Root metadata has no `openGraph` or `twitter`. Add defaults, a canonical base, and a share image. [UX-3]
- [x] **7.2 `sitemap.ts` and `robots.ts`** (S/M). Include public opportunities and training pages. Exclude private routes. [UX-4]
- [x] **7.3 Route-neutral error copy** (S). `src/app/error.tsx` says "temporary problem while loading your pathway" on every route. Add a retry action. [UX-5]

---

## Suggested order of attack

1. **Quick wins and safety:** 0.1, 0.2, 1.8 (proxy), 3.1 (Poppler check), 2.4 (headers).
2. **Launch gate:** section 1 in full. Legal pages (1.1), demo separation (1.2–1.5, 1.9), and data deletion and retention (1.6–1.7) are the real work.
3. **Safety net:** 6.1 (CI), 4.1 (run SQL tests), 3.12, 6.2, so later changes are protected.
4. **Pipeline reliability:** 3.2–3.7 together, since they touch the same code and tests.
5. **Abuse and cost:** 2.1–2.3.
6. **Ops:** section 5, then the rest.

## Open questions for the owner

- Is the live Supabase project the one real users will use, or will a separate production project be created (affects 1.2, 1.3, 4.3)?
- Where should the processor live long term (affects 3.8, 3.9)?
- Is there an intended monetization model for launch (affects 1.1)?
- Was removing the proxy in commit `cd2d267` intentional? If so, the session-refresh design needs a replacement, not just a revert (affects 1.8).
