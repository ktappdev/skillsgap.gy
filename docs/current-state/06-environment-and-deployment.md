# Environment and deployment snapshot

## Web app variables

Defined/required by `src/lib/env.ts` and `.env.example`:

| Variable | Scope | Current role |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser-safe | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe | Supabase publishable key |
| `NEXT_PUBLIC_SITE_URL` | Browser-safe/config | Canonical origin for auth callbacks and metadata; defaults locally to `http://localhost:3000` |
| `NEXT_PUBLIC_DEMO_LOGIN_ENABLED` | Browser-safe flag | Shows demo-login UI when true |
| `DEMO_*_EMAIL/PASSWORD` | Server-only | Demo account setup/login |
| `DEMO_COMPANY_ID`, `DEMO_PROVIDER_ID` | Server-only | Demo seed identity references |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Scripts/admin client/processor integration |
| `CSEC_SLIP_PROCESSOR_URL`, `CSEC_SLIP_PROCESSOR_SECRET` | Server-only | Optional result-slip proxy to the Go service |

## Processor variables

Defined by `services/processor/config.go` and its README:

| Variable | Current role |
| --- | --- |
| `PORT` | HTTP listen port; default `8080` |
| `WEBHOOK_SECRET` | Authenticates Supabase-to-Go resume webhooks |
| `SUPABASE_URL` | Supabase REST/Storage base URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Processor server credential |
| `LLM_BASE_URL` | OpenAI-compatible model API base URL; normally ending in `/v1` |
| `LLM_API_KEY` | Optional model endpoint bearer key; required when the selected provider requires it |
| `LLM_MODEL` | Exact model identifier served by the selected endpoint |
| `PROCESSOR_SCRATCH_DIR` | Temporary PDF/render directory; default `/ephemeral/skillsgap-processor` |
| `OCR_URL`, `OCR_SERVICE_SECRET` | Dormant rollback path settings |
| `CSEC_SLIP_PROCESSOR_SECRET` | Optional public slip endpoint secret |

## Deployment assumptions recorded in the repo

- Next.js deploys from the repository root to Vercel project `skillsgap-gy`.
- Supabase is the linked database/auth/storage project.
- The former demo deployment ran Go and Qwen on Thunder Compute, with only the Go port forwarded.
- The OCR service is intentionally dormant.
- The custom domain is `skillsgap.gy` with Cloudflare DNS.

These are repository instructions and runbook assumptions; they are not evidence that the external services are currently running.

## Local behavior when services are absent

- The web build can pass without the Go/model service because it does not call the processor during build.
- Public career routes can use static fallback data.
- Public result-slip automatic reading returns unavailable when its two env vars are absent; manual entry remains usable.
- CV processing queues work but cannot complete until a processor is available.
