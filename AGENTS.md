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

Thunder processor checks (run from `services/processor`):

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

## Hackathon deployment

- The Next.js application deploys from the repository root to Vercel project `skillsgap-gy`, authenticated as `ktad` under `ken-taylors-projects`. Promote a verified preview rather than rebuilding for production.
- The custom domain's DNS remains on Cloudflare. `skillsgap.gy` is assigned in Vercel and awaits this DNS-only record: `A skillsgap.gy 76.76.21.21`. Do not move nameservers or add CNAME records for the apex.
- Supabase Auth uses `https://skillsgap.gy` as its site URL. Its allow-list includes the canonical hostname, localhost URLs, and the current verified preview URL; add a newly created preview URL before testing an OAuth-style redirect there.
- Keep `NEXT_PUBLIC_SITE_URL=https://skillsgap.gy` in Vercel Preview and Production. Keep local `.env.local` local-only; never run a command that overwrites it without a backup.
- Keep the CV upload path direct from the browser to private Supabase Storage. Vercel serves the application; it must not proxy CV bytes, OCR, Qwen, or the Go processor.
- Thunder Compute hosts the private processing stack: Go on `0.0.0.0:8080` via Thunder HTTPS forwarding and Qwen on `127.0.0.1:8000`. The active MVP does not require PP-Structure OCR; keep port `8090` unbound and never forward ports `8000` or `8090`. Do not add Caddy.
- The current Thunder Go forwarding URL is `https://e2tpybmi-8080.thundercompute.net`; Supabase sends only `{ "job_id": "..." }` to `/webhooks/resume` through the Vault-backed trigger migration.

## Commit checkpoints

- Number each hackathon checkpoint sequentially with two digits and a colon: `NN: concise imperative description`.
- Keep one product milestone per commit; do not mix unrelated features, infrastructure, or formatting changes.
- Include the tests and documentation needed to explain or verify that milestone in the same checkpoint.
- Use a judge-readable subject, such as `03: build the applicant pathway`.
- Review the staged file list and run the relevant checks before pushing each checkpoint.
- Never commit `.env.local`, credentials, or other secrets. If a corrective follow-up is required, continue the sequence and state the concrete fix.

## Thunder Qwen3.6 vision-only extraction

- The Thunder vLLM endpoint is configured only in the local, ignored `.env.local` file through `VLLM_URL`, `VLLM_MODEL`, and `VLLM_API_KEY`. The chosen model is Qwen3.6-35B-A3B with vision support.
- The API key is a bearer secret: never commit it, print it, paste it into issues, or include it in logs. Rotate it after testing or the hackathon.
- Model discovery can be checked without exposing the key: `set -a; . ./.env.local; set +a; curl --fail --silent --show-error --max-time 30 "$VLLM_URL/models" -H "Authorization: Bearer $VLLM_API_KEY" | jq '{data: [.data[] | {id, object, owned_by}], object}'`.
- Render every validated PDF page locally and send an instruction prompt, active qualification taxonomy snapshot, and ordered page images to Qwen vision. Do not send native PDF text, OCR text, job requirements, or match data in the active MVP path. The model extracts evidence-backed taxonomy slugs only; PostgreSQL calculates matches and applicant confirmation remains the eligibility gate.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
