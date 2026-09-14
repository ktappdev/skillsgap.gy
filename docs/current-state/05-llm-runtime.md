# LLM and processor runtime snapshot

## Current implementation

The Go service in `services/processor` builds an `llmClient` with three config values:

- `VLLM_URL`, default `http://127.0.0.1:8000/v1`
- `VLLM_API_KEY`, required
- `VLLM_MODEL`, default `qwen3.6-35b-a3b`

It sends `POST {base URL}/chat/completions` with a model name, temperature `0`, a system extraction prompt, ordered page images as `data:` URLs, and a strict JSON-schema response format. It also uses the same client shape for optional CSEC/CXC result-slip reading.

The client is technically compatible with providers that implement the OpenAI chat-completions shape, but the configuration, naming, comments, runbooks, and operational assumptions are still VLLM/Thunder-specific. There is no provider enum, generic LLM endpoint config, capability negotiation, provider-specific request adapter, or local-vs-hosted switch.

## Resume extraction contract

The worker:

1. Downloads a private PDF from Supabase.
2. Validates PDF signature, size (15 MB), and page count (1–8).
3. Renders every page at the configured renderer’s resolution.
4. Loads a fresh active taxonomy snapshot.
5. Sends the ordered images plus instructions; it does not send native PDF text or OCR text on the active path.
6. Accepts up to 50 findings, employment rows, and unmapped terms within bounded text/numeric ranges.
7. Requires evidence-backed findings with valid taxonomy slugs, page numbers, `vision` method, and confidence.
8. Persists the complete extraction through a database RPC.

## Worker behavior

The HTTP service exposes `GET /healthz` and authenticated `POST /webhooks/resume`. It maintains an in-memory signal channel of 20 job IDs, a worker, and a 20-second poller. The durable database queue is the recovery mechanism when webhook signals are missed or the channel is full. Jobs have a ten-minute processing timeout and safe applicant-facing failure messages.

## Offline state

If the Go service and model server are off, new CV uploads can still land in Storage and create queued jobs, but no worker claims them. The UI remains in waiting/queued state until the external processor returns or a failure is recorded. The app does not currently detect or explain “processor is intentionally offline” as a distinct state.

## Desired next direction: provider-agnostic configuration

The requested future behavior is: configure an OpenAI-compatible endpoint through environment variables and use the same processor with OpenRouter, a local Ollama server, or another compatible service. The current snapshot does not implement that abstraction. The likely boundary is the `profileExtractor`/`llmClient` seam, while preserving the extraction contract and validation above. Any future implementation must verify the exact request/response capabilities needed for vision input and strict structured output; model/provider configuration alone cannot guarantee those capabilities.

## Security constraints to preserve

- API keys stay server-only and must never be logged.
- CV bytes, rendered page images, prompts, model responses, and PII must not appear in logs.
- The browser must never call the model endpoint directly.
- Provider URLs must not be allowed to turn the worker into an unrestricted proxy.
