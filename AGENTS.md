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

## Commit checkpoints

- Number each hackathon checkpoint sequentially with two digits and a colon: `NN: concise imperative description`.
- Keep one product milestone per commit; do not mix unrelated features, infrastructure, or formatting changes.
- Include the tests and documentation needed to explain or verify that milestone in the same checkpoint.
- Use a judge-readable subject, such as `03: build the applicant pathway`.
- Review the staged file list and run the relevant checks before pushing each checkpoint.
- Never commit `.env.local`, credentials, or other secrets. If a corrective follow-up is required, continue the sequence and state the concrete fix.

## Local Qwen testing

- The Thunder vLLM endpoint is configured only in the local, ignored `.env.local` file through `VLLM_URL`, `VLLM_MODEL`, and `VLLM_API_KEY`.
- The currently verified served model is `qwen3.6-35b`. The API key is a bearer secret: never commit it, print it, paste it into issues, or include it in logs. Rotate it after testing or the hackathon.
- Model discovery can be checked without exposing the key: `set -a; . ./.env.local; set +a; curl --fail --silent --show-error --max-time 30 "$VLLM_URL/models" -H "Authorization: Bearer $VLLM_API_KEY" | jq '{data: [.data[] | {id, object, owned_by}], object}'`.
- Keep the text-first extraction path as the working fallback. Enable multimodal `vision_review` only after a non-sensitive image smoke test returns schema-valid JSON.
