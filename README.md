# SkillsGap.gy matches the skills you already have against real opportunities in Guyana, shows you where you fall short,and connects you with the training needed to close the gap.
This platform is not just another job site. It guides you from your search to your success. The main framework has two components. 
## Component 1

**EMPLOYERS**: tell SkillsGap what they need 
**SKILLSGAP.GY**: identifies shortages
**TRAINING PROVIDERS**: train for actual demand 
**INDIVIDUALS**: develop the missing skills 
**EMPLOYERS**: gain a better-qualified local talent pool

## Component 2
**Student** Chooses the 'I want to become' tad and uploads Interests, Subjects they plan to write for CXC
**SkillsGap** Identifies skills, certification and requirement needed based on exact or similar positions posted by a company on the platform. 

# Main Features: 

1. User uploads CV/Resume 
2. A trained and tailored AI maps them against real job postings + Local Content Register requirements + common SBM/Exxon/contractor role profiles. 
3. Output: “You’re 70% ready for Production Technician — missing these 3 certifications / 1 year experience. Here are free/paid paths at GTTCI, BIT, 3t EnerMech, online modules, and estimated time/cost.”  
4. Includes direct apply links and “register on LC Employment Register”. Also resources to training institutes, universities, certifications and degrees.

## Getting started

### Prerequisites

- Node.js `>=20.9.0` (`engines.node` in `package.json`)
- pnpm `11.24.0` (`packageManager` in `package.json`; Corepack honors this pin)
- Go `1.22` or newer for the processor (`services/processor/go.mod`)
- Poppler (`pdfinfo` and `pdftoppm`) for the processor's PDF checks and page rendering
- The Supabase CLI for the database commands below

### Install

```bash
pnpm install
pnpm dev
```

### Environment

Copy the template and fill in the values for your Supabase project:

```bash
cp .env.example .env.local
```

`.env.example` documents every variable the web app and its scripts read. Server-only values (service-role key, demo credentials, model and processor secrets) must never use the `NEXT_PUBLIC_` prefix. The processor reads its own secrets from `services/processor/.env`; see [`services/processor/README.md`](services/processor/README.md).

### Checks

Web app, from the repository root:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Processor, from `services/processor`:

```bash
go test ./...
go vet ./...
go build ./...
```

Supabase verification, without changing the linked project:

```bash
supabase db push --dry-run --include-seed --project-ref uoaudfdaffnlrjwqnnnq
supabase db lint --linked --project-ref uoaudfdaffnlrjwqnnnq --schema public --fail-on error
```

Demo fallback account, from the repository root:

```bash
node --env-file=.env.local scripts/setup-demo-users.mjs
node --env-file=.env.local scripts/prepare-demo-fallback.mjs
node --env-file=.env.local scripts/check-demo-readiness.mjs
```

The same scripts are available as `pnpm setup:demo-users`, `pnpm prepare:demo-fallback`, and `pnpm check:demo-readiness`. Operational runbooks live in [`docs/runbooks/`](docs/runbooks/README.md).

Continuous integration (`.github/workflows/ci.yml`) runs the web checks (typecheck, lint, test) and the processor checks (vet, test, build). It does not use Supabase secrets.

### Processor

The Go processor is a private service that reads applicant CVs and descriptions through a vision-capable model. Its setup, required environment variables, and RPC contract are documented in [`services/processor/README.md`](services/processor/README.md).

## Project layout

```text
src/app/              Next.js App Router pages and route handlers
src/components/       Shared and feature UI components
src/lib/              Domain logic: auth guards, SkillsGap matching, Supabase clients, env
src/proxy.ts          Request proxy that refreshes the Supabase session cookie
supabase/             Config, migrations, seed data, and database tests
scripts/              Operational scripts: demo accounts, readiness checks, database reset
services/processor/   Private Go processor for CV and description extraction
docs/                 Product, architecture, and operations documentation (runbooks in docs/runbooks/)
.github/workflows/    Continuous integration
``` 

