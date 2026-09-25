# API routes under `/api/i-want-to-become`

Sources: `src/app/api/i-want-to-become/occupations/route.ts`, `src/app/api/i-want-to-become/occupations/[slug]/route.ts`, `src/app/api/i-want-to-become/slip/route.ts`, `src/app/api/i-want-to-become/skill-preview/route.ts`

## `GET /api/i-want-to-become/occupations`

Calls `get_public_occupations`, validates every RPC row, normalizes snake_case to client shape, and returns a cacheable public response. If the RPC is unavailable, empty, or malformed, it returns the static occupation catalogue with the same response shape.

## `GET /api/i-want-to-become/occupations/[slug]`

Validates a kebab-case slug, calls `get_public_occupation_pathway`, validates and normalizes the live row, and otherwise returns a static curated fallback. A missing static route returns 404. Responses carry a `source` value of `live` or `fallback`.

## `POST /api/i-want-to-become/slip`

Accepts a JPEG/PNG/WebP image up to 8 MB, applies an in-memory per-IP limit of five requests per ten minutes, and requires `CSEC_SLIP_PROCESSOR_URL` plus `CSEC_SLIP_PROCESSOR_SECRET`. It proxies the image to the processor’s `/public/csec-result-slip` endpoint with a secret header, validates bounded `{subject, grade, confidence}` rows, and returns only result pairs. Missing processor configuration returns 503; the client keeps manual entry available.

## `POST /api/i-want-to-become/skill-preview`

Anonymous. Accepts JSON `{ "text": "…" }` with 10–2000 characters after trimming and otherwise returns 400 `{message}`. Uses `SKILL_PREVIEW_PROCESSOR_URL` and `SKILL_PREVIEW_PROCESSOR_SECRET` when set; otherwise falls back to the CSEC slip processor URL and secret. Returns 503 `{message}` when neither pair is configured.

The route issues the `sg_skill_preview` cookie itself (httpOnly, `SameSite=Lax`, secure in production, one year) and uses it to count previews per browser: 5 per 24 hours per visitor, plus a global daily ceiling from `SKILL_PREVIEW_GLOBAL_DAILY_LIMIT` (default 200). Both limits are enforced in one atomic `consume_skill_preview` call before the model runs, so they hold across server instances and the quota is spent even if the processor then fails; there is no refund. A visitor who clears cookies gets a new allowance only until the global daily ceiling is reached.

It proxies the trimmed text to the processor’s `/public/skill-preview` endpoint with the `X-Skill-Preview-Secret` header and a 30-second timeout, validates the returned findings, and answers `{ preview: { skills, roles, unmappedTerms }, remaining, resetAt }`. Each role carries `matchedCount` and `requirementCount` with its unsatisfied requirements as gaps, mandatory first, and any known training that closes a gap; there is no score field. Denials and outages also use `{message}`: 429 when the visitor’s own allowance is used up or a previous preview was requested within the last minute, 503 when the global ceiling or the processor is unavailable.

## Privacy and operational notes

The slip endpoint does not persist the photo. The skill-preview endpoint persists nothing at all: no job row, no findings, no free-text storage, and the visitor cookie holds only a random identifier. The proxy does not log image contents, submitted text, or model responses. The in-memory rate limit is process-local, so it is not a distributed abuse-control mechanism; the skill-preview quota is not in-memory and is not subject to that limitation.
