# AGENTS.md

## Project

SkillsGap.gy matches a person's existing skills against real opportunities in Guyana, identifies the skills and qualifications they are missing, and connects them with training to close those gaps.

## Commands

Web app checks (run from the repository root):

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Processor checks (run from `services/processor`):

```bash
go test ./...
go vet ./...
go build ./...
```

Python syntax check (run from the repository root):

```bash
python3 -c "from pathlib import Path; compile(Path('services/ocr/app.py').read_text(), 'services/ocr/app.py', 'exec')"
```

OCR validation tests (run from the repository root):

```bash
python3 -m unittest services/ocr/test_validation.py
```

Supabase verification without changing the linked project:

```bash
supabase db push --dry-run --include-seed --project-ref uljznzafpiamxmervxjb
supabase db lint --linked --project-ref uljznzafpiamxmervxjb --schema public --fail-on error
```

Prepare and verify the non-sensitive fallback demo account:

```bash
node --env-file=.env.local scripts/setup-demo-users.mjs
node --env-file=.env.local scripts/prepare-demo-fallback.mjs
node --env-file=.env.local scripts/check-demo-readiness.mjs
```

## Conventions

- Keep files and components small; prefer readable, domain-named code over cryptic names or premature abstractions.
- For TypeScript, avoid `any`, prefer inferred types, and use the repository's established style.
- Keep features aligned with the product loop: skills → opportunities → gaps → training. Use those domain nouns in code where appropriate.
- For UI work, follow the existing visual system and accessibility conventions rather than introducing a second design language.

## Workflow

- Do not automatically start servers, deploy migrations, or install dependencies unless explicitly requested. Read-only checks and proportionate builds are appropriate after implementation changes.
- Ground changes in the repository and verify assumptions before implementing them.
- Keep `.env.local` populated locally but ignored by Git. Never expose service-role credentials to the browser.
- Supabase schema changes live in `supabase/migrations`; seed records live in `supabase/seed.sql`. Use the dry-run commands above before any explicit deployment.
- `pnpm reset:db --target local|production [--mode trash|reseed] [--dry-run]` re-creates a database from `supabase/migrations` plus `supabase/seed.sql`. `--mode trash` destroys data, and `--target production --mode trash` additionally requires `--confirm=<project-ref>` because it truncates every `auth.*` table and deletes all hosted users, including the demo logins; anything that exists only in the live database, and not in a migration or `seed.sql`, is lost.

## Opportunity and match wiring

An opportunity is only matchable after every link in this chain exists:

1. **Taxonomy:** Add a canonical row to `public.qualifications` with a stable slug and `is_active = true`. Add the phrases people may use in CVs to `public.qualification_aliases`. The processor reads the active taxonomy through `supabase/migrations/20260905205305_expose_active_extraction_taxonomy.sql`; an alias alone is not enough. If a role reuses an older qualification, explicitly reactivate it in the new migration and include it in readiness checks.
2. **Training:** Add or verify a provider, an active program, and one `training_program_outcomes` row for every qualification used by the role. Providers must be verified before their programs are visible. A role requirement with no verified active training outcome will fail the demo readiness check and will show no training pathway in its gap card.
3. **Role and requirements:** Add the company, then the `job_roles` row, then `job_requirements` rows joined by qualification slug. Requirements carry `weight`, optional `minimum_years`, and `mandatory`. The company must be `approved`; the role must be `active` and have a `published_at` value. Seed data may insert a draft and promote it later, but an existing linked database needs the migration to create or update the records directly.
4. **Applicant match:** Only confirmed, active `applicant_qualifications` satisfy a requirement. PostgreSQL calculates the score and mandatory gate in `apply_match_recalculation`; it creates a `job_matches` row and one `match_gaps` row for each unsatisfied requirement. Extracted or pending findings do not count until the applicant confirms them.
5. **Dashboard visibility:** `src/lib/skillsgap/queries.ts` filters to current matches for active roles at approved companies and then returns only the top three by score. A correctly wired role can exist in the database but not appear on the dashboard if its score is below those three. Use the opportunities view or the readiness query to distinguish “not wired” from “ranked below the dashboard limit.”
6. **Demo reset:** Keep the fallback skills identical in `scripts/prepare-demo-fallback.mjs` and `src/lib/skillsgap/actions.ts`. The reset deletes the fallback applicant's qualifications and matches, re-adds the curated skills, recalculates every active demo role, rebuilds gaps, and recreates the demo invitation. Add representative skills here when a new seeded pathway must appear in the top three. The static no-resume fallback in `src/lib/skillsgap-demo.ts` is intentionally a small three-match presentation fallback; it does not automatically expand when seed roles are added.

For every new seeded pathway, make the data change in both places:

- `supabase/seed.sql` for a clean local `supabase db reset`.
- A timestamped migration created with a concrete name, for example `supabase migration new add_new_career_pathway`, for an already-linked database. Do not assume `seed.sql` changes are deployed by the application or by `git push`.

Before declaring the pathway complete, run `supabase db push --dry-run --include-seed --project-ref uljznzafpiamxmervxjb`, `supabase db lint --linked --project-ref uljznzafpiamxmervxjb --schema public --fail-on error`, the fallback preparation/readiness commands above, and the normal web checks. Deploy with `supabase db push --include-seed --project-ref uljznzafpiamxmervxjb` only after the target environment and destructive impact are explicitly approved.

## Hackathon deployment

- The Next.js application deploys from the repository root to Vercel project `skillsgap-gy`, authenticated as `ktad` under `ken-taylors-projects`. Promote a verified preview rather than rebuilding for production.
- The custom domain's DNS remains on Cloudflare. `skillsgap.gy` is assigned in Vercel and awaits this DNS-only record: `A skillsgap.gy 76.76.21.21`. Do not move nameservers or add CNAME records for the apex.
- Supabase Auth uses `https://skillsgap.gy` as its site URL. Its allow-list includes the canonical hostname, localhost URLs, and the current verified preview URL; add a newly created preview URL before testing an OAuth-style redirect there.
- Keep `NEXT_PUBLIC_SITE_URL=https://skillsgap.gy` in Vercel Preview and Production. Keep local `.env.local` local-only; never run a command that overwrites it without a backup.
- Keep the CV upload path direct from the browser to private Supabase Storage. Vercel serves the application; it must not proxy CV bytes, model requests, or the Go processor.
- The Go processor is a private external service. Keep its webhook endpoint protected, expose only the configured processor port, and never expose the model endpoint or temporary document-processing storage publicly.
- Supabase sends only `{ "job_id": "..." }` to the configured processor webhook through the Vault-backed trigger migration. Keep the processor deployment URL and webhook secret environment-specific; do not hardcode them in the repository.

## Commit checkpoints

- Number each hackathon checkpoint sequentially with two digits and a colon: `NN: concise imperative description`.
- Keep one product milestone per commit; do not mix unrelated features, infrastructure, or formatting changes.
- Include the tests and documentation needed to explain or verify that milestone in the same checkpoint.
- Use a judge-readable subject, such as `03: build the applicant pathway`.
- Review the staged file list and run the relevant checks before pushing each checkpoint.
- Never commit `.env.local`, credentials, or other secrets. If a corrective follow-up is required, continue the sequence and state the concrete fix.

## Provider-agnostic vision extraction

- Configure the model endpoint, model identifier, and API key through server-only environment variables. The processor must support OpenAI-compatible hosted and local endpoints without hardcoding a hosting vendor or model family.
- Model API keys are bearer secrets: never commit them, print them, paste them into issues, or include them in logs.
- Before live processing, verify that the configured endpoint exposes the selected model and supports the capabilities required by the extraction contract: vision input and strict structured JSON output. Do not expose the key while checking connectivity.
- Render every validated PDF page locally and send an instruction prompt, active qualification taxonomy snapshot, and ordered page images to the configured vision model. Do not send native PDF text, OCR text, job requirements, or match data in the active MVP path. The model extracts evidence-backed qualifications and employment, plus candidate-owned contact suggestions only when clearly visible. Contact suggestions retain page evidence and stay private until the applicant applies them. The applicant confirms contact details before they change the profile; the sign-in email is separate, and role-specific profile sharing controls employer access to a CV contact email.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
