# SkillsGap.gy

SkillsGap.gy is a Guyana-focused career transition engine for oil-and-gas local content. An applicant starts with experience—not a job title—and gets a clear path from CV → strengths → skill gaps → local training → interview.

This is the 72-hour hackathon MVP. The applicant journey is the headline demo; company and admin workspaces make the ecosystem credible.

## Stack

- Next.js 16 App Router, TypeScript, React 19, Tailwind CSS 4
- Supabase Auth, PostgreSQL, Row Level Security, private Storage, and Realtime
- Thunder Compute: Go processor, PP-StructureV3 OCR, and vLLM `gpt-oss-20b`
- Vercel for the web app; one forwarded Thunder endpoint for the Go API

## Run the web app

Requirements: Node.js 20.9+, pnpm 11, and a Supabase project.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

The existing local `.env.local` is intentionally ignored by Git. Keep populated values there; never commit it or put a service-role key in a `NEXT_PUBLIC_` variable.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase key |
| `NEXT_PUBLIC_SITE_URL` | Auth callback origin |

## Product routes

- `/` — applicant-first landing page
- `/signup`, `/login` — applicant authentication
- `/dashboard` — private CV upload, processing state, live matches, and small-win progress
- `/matches/:matchId` — strengths, gaps, and local training pathway
- `/interviews` — invitations and atomic 15-minute slot booking
- `/company/request-access` — authenticated company request (sign-in returns here)
- `/company/*` — approved company roles, anonymized candidates, and job fairs
- `/admin/*` — manually promoted super-admin company, taxonomy, and training management

## Database

Apply the tracked migrations to the linked Supabase project:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push --include-seed
```

`20260904210003_skillsgap_domain.sql` replaces the generic starter model with the SkillsGap domain, private owner-scoped CV storage, RLS policies, processing RPCs, and Realtime tables. Curated demo records are loaded from `supabase/seed.sql` for Guyana Offshore Operations, Demerara Industrial Services, and Essequibo Logistics Partners. The seed contains no passwords or Auth users: create demo accounts through the app, then promote the first admin manually by inserting that Auth user ID into `public.platform_admins`.

The database calculates match scores from canonical qualifications and weighted requirements. The local model extracts facts only; it cannot score candidates or make hiring decisions.

After the first database push, create one Supabase Database Webhook in the dashboard: table `public.processing_jobs`, event `INSERT`, URL `https://YOUR-THUNDER-FORWARDED-HOST/webhooks/resume`, and header `X-Webhook-Secret` with the same value as the Go service's `WEBHOOK_SECRET`. The webhook body may be the standard Supabase event envelope; the worker reads only `record.id`. The Go poller remains the recovery path if delivery is delayed.

## Thunder services

Source lives under `services/`:

- `services/processor` — Go API on `0.0.0.0:8080`, `GET /healthz`, authenticated `POST /webhooks/resume`
- `services/ocr` — PP-StructureV3 on `127.0.0.1:8090`, authenticated `POST /parse`
- vLLM — `gpt-oss-20b` on `127.0.0.1:8000/v1`

The Go service claims durable Supabase jobs, tries native `pdftotext` first, falls back to OCR for scans/unusable text, validates strict LLM JSON, and calls the service-only extraction RPC. Webhooks are delivery nudges; `processing_jobs` is the source of truth. See the Thunder runbooks in [`docs/thundercompute`](docs/thundercompute) and the service READMEs for environment variables and systemd/port-forwarding details.

Run processor checks from its directory:

```bash
cd services/processor
go test ./...
go vet ./...
go build ./...
```

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

The fastest judge path is: create applicant → upload a representative PDF → show “CV is being understood” → review or correct one extracted work-history row → show the top three routes → open one gap → select a Guyana training path → demonstrate the interview threshold/slot screen. Keep a prepared account and seeded demo records available if Thunder inference is unavailable.

See [`docs/PRD.md`](docs/PRD.md) for the decision-complete scope, acceptance criteria, security rules, test matrix, rehearsal script, and risk register.
