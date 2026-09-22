# SkillsGap.gy current-state snapshot

Snapshot date: 2026-09-14

This folder is a point-in-time specification captured before the 2026-09-21 polish pass. It is intentionally descriptive: it records the routes, visible behavior, data flow, permissions, runtime dependencies, tests, and known journey gaps from that snapshot.

For the current product state and the changes made after this snapshot, read [the product polish audit](../polish-audit.md) first.

## Where to start

1. [System map](./00-system-map.md) — the product loop and the major runtime boundaries.
2. [Page index](./01-page-index.md) — every page and API route, with the source file that owns it.
3. [Pages](./02-pages/) — one route-specific markdown spec per page, plus a few area overview notes.
4. [Features](./03-features/) — cross-page behavior such as CV processing, matching, consent, and career-route saving.
5. [Data and backend](./04-data-and-backend.md) — Supabase tables, RPCs, workers, storage, and authorization.
6. [LLM runtime](./05-llm-runtime.md) — the processor’s OpenAI-compatible endpoint contract and its operational boundaries.
7. [Environment and deployment](./06-environment-and-deployment.md) — environment variables and deployment assumptions.
8. [UX and journey audit](./07-ux-and-journey-audit.md) — current navigation/back-button behavior, density, and journey risks.
9. [Verification and open issues](./08-verification-and-open-issues.md) — checks run for this snapshot and the highest-value follow-up work.

## Important scope note

The public root and FAQ now link visitors into the implemented product loop. The Go processor and any model server are external processes, not started by the Next.js app; the repository still contains their source and deployment runbooks.

The processor now uses `LLM_BASE_URL`, optional `LLM_API_KEY`, and `LLM_MODEL` for an OpenAI-compatible vision endpoint. The endpoint still must support image input and strict JSON-schema output; configuration alone does not guarantee those capabilities.

## Evidence convention

Each page spec names its route, source owner, visible sections, actions, data dependencies, access behavior, empty/error states, and UX observations. Source references use repository-relative paths and line numbers captured during this snapshot.
