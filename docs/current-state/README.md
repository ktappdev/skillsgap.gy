# SkillsGap.gy current-state snapshot

Snapshot date: 2026-09-14

This folder is a point-in-time specification of the repository as it exists today. It is intentionally descriptive: it records the routes, visible behavior, data flow, permissions, runtime dependencies, tests, and known journey gaps before the next rebuild.

## Where to start

1. [System map](./00-system-map.md) — the product loop and the major runtime boundaries.
2. [Page index](./01-page-index.md) — every page and API route, with the source file that owns it.
3. [Pages](./02-pages/) — one route-specific markdown spec per page, plus a few area overview notes.
4. [Features](./03-features/) — cross-page behavior such as CV processing, matching, consent, and career-route saving.
5. [Data and backend](./04-data-and-backend.md) — Supabase tables, RPCs, workers, storage, and authorization.
6. [LLM runtime](./05-llm-runtime.md) — the current VLLM/Thunder-shaped contract and what is not provider-agnostic yet.
7. [Environment and deployment](./06-environment-and-deployment.md) — environment variables and deployment assumptions.
8. [UX and journey audit](./07-ux-and-journey-audit.md) — current navigation/back-button behavior, density, and journey risks.
9. [Verification and open issues](./08-verification-and-open-issues.md) — checks run for this snapshot and the highest-value follow-up work.

## Important scope note

The public root currently presents a coming-soon page. The authenticated product remains implemented behind its routes. The Go processor and the former Thunder Compute model server are external processes, not started by the Next.js app; the repository still contains their source and deployment runbooks.

The current processor is not yet a generic “configure any OpenAI-compatible LLM” implementation. It uses `VLLM_URL`, `VLLM_API_KEY`, and `VLLM_MODEL` in code and documentation. That is recorded as current state, not as a recommendation for the next architecture.

## Evidence convention

Each page spec names its route, source owner, visible sections, actions, data dependencies, access behavior, empty/error states, and UX observations. Source references use repository-relative paths and line numbers captured during this snapshot.
