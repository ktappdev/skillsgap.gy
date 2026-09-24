# LLM and processor runtime snapshot

## Current implementation

The Go service in `services/processor` builds an `llmClient` with three endpoint values:

- `LLM_BASE_URL`, normally ending in `/v1`
- `LLM_API_KEY`, optional for keyless local servers and required by hosted providers that authenticate with bearer tokens
- `LLM_MODEL`, the exact model identifier exposed by the endpoint

It sends `POST {base URL}/chat/completions` with a model name, temperature `0`, a system extraction prompt, ordered page images as `data:` URLs, and a strict JSON-schema response format. It also uses the same client shape for optional CSEC/CXC result-slip reading.

Both production request paths set `reasoning_effort` to `none`. The readiness probe and documented model smoke test use the same setting, so configured models must accept reasoning-disabled requests.

The client is intentionally built around the OpenAI-compatible chat-completions shape. The environment boundary is provider-neutral, while deployment runbooks can still name a particular private host or model. The readiness check verifies model discovery, image input, and strict JSON-schema output before a live rehearsal.

## Resume extraction contract

The worker:

1. Downloads a private PDF from Supabase.
2. Validates PDF signature, size (15 MB), and page count (1–8).
3. Renders every page at the configured renderer’s resolution.
4. Loads a fresh active taxonomy snapshot.
5. Sends the ordered images plus instructions; it does not send native PDF text or OCR text on the active path.
6. Accepts up to 50 findings, employment rows, and unmapped terms within bounded text/numeric ranges, plus a structured contact object.
7. Requires evidence-backed findings with valid taxonomy slugs, page numbers, `vision` method, and confidence. Contact suggestions include a value, source excerpt, page, and confidence; uncertain values are dropped.
8. Persists contact suggestions privately without changing the profile. The applicant must apply a suggestion before profile values change. The sign-in email remains separate, and a CV contact email is returned to employers only through the role-consented profile RPC.

## Worker behavior

The HTTP service exposes `GET /healthz` and authenticated `POST /webhooks/resume`. It maintains an in-memory signal channel of 20 job IDs, a worker, and a 20-second poller. The durable database queue is the recovery mechanism when webhook signals are missed or the channel is full. Jobs have a ten-minute processing timeout and safe applicant-facing failure messages.

## Offline state

If the Go service and model server are off, new CV uploads can still land in Storage and create queued jobs, but no worker claims them. The UI remains in waiting/queued state until the external processor returns or a failure is recorded. The app does not currently detect or explain “processor is intentionally offline” as a distinct state.

## Operational boundary

Configure an OpenAI-compatible endpoint through environment variables and use the same processor with a hosted service or a compatible local server. The `profileExtractor`/`llmClient` seam remains the correct boundary for future provider-specific behavior, while preserving the extraction contract and validation above. Model/provider configuration alone cannot guarantee vision input or strict structured output, so the readiness check remains mandatory.

## Security constraints to preserve

- API keys stay server-only and must never be logged.
- CV bytes, rendered page images, prompts, model responses, and PII must not appear in logs.
- The browser must never call the model endpoint directly.
- Provider URLs must not be allowed to turn the worker into an unrestricted proxy.
