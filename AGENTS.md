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

Supabase verification without changing the linked project:

```bash
supabase db push --dry-run --include-seed --project-ref uljznzafpiamxmervxjb
supabase db lint --linked --project-ref uljznzafpiamxmervxjb --schema public --fail-on error
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
