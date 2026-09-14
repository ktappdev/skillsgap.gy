# API routes under `/api/i-want-to-become`

Sources: `src/app/api/i-want-to-become/occupations/route.ts`, `src/app/api/i-want-to-become/occupations/[slug]/route.ts`, `src/app/api/i-want-to-become/slip/route.ts`

## `GET /api/i-want-to-become/occupations`

Calls `get_public_occupations`, validates every RPC row, normalizes snake_case to client shape, and returns a cacheable public response. If the RPC is unavailable, empty, or malformed, it returns the static occupation catalogue with the same response shape.

## `GET /api/i-want-to-become/occupations/[slug]`

Validates a kebab-case slug, calls `get_public_occupation_pathway`, validates and normalizes the live row, and otherwise returns a static curated fallback. A missing static route returns 404. Responses carry a `source` value of `live` or `fallback`.

## `POST /api/i-want-to-become/slip`

Accepts a JPEG/PNG/WebP image up to 8 MB, applies an in-memory per-IP limit of five requests per ten minutes, and requires `CSEC_SLIP_PROCESSOR_URL` plus `CSEC_SLIP_PROCESSOR_SECRET`. It proxies the image to the processor’s `/public/csec-result-slip` endpoint with a secret header, validates bounded `{subject, grade, confidence}` rows, and returns only result pairs. Missing processor configuration returns 503; the client keeps manual entry available.

## Privacy and operational notes

The slip endpoint does not persist the photo. The proxy does not log image contents. The in-memory rate limit is process-local, so it is not a distributed abuse-control mechanism.
