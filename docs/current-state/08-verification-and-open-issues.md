# Verification and open issues

## Checks run for this snapshot

Run from the repository root unless noted:

- `pnpm test` — passed: 16 files, 64 tests.
- `pnpm typecheck` — passed.
- `pnpm lint` — passed.
- `pnpm build` — passed; Next reported 33 application routes, with public static routes and dynamic server-rendered routes as listed in [the page index](./01-page-index.md).
- `go test ./...` from `services/processor` — passed.

No dev server was started, and no browser/GUI testing was performed.

## Confirmed current gaps

1. The root landing page does not link into the working product.
2. The Go/model service is external and currently offline by user report; queued CV processing cannot complete without a processor.
3. Processor configuration is VLLM-specific in names and operational documentation.
4. There is no generic provider adapter/capability check for OpenRouter, Ollama, or another OpenAI-compatible endpoint.
5. The applicant detailed pathway page is long and has no explicit global back/section navigation.
6. The authenticated overview and detailed pathway are two separate dashboard destinations and need a clearer relationship.
7. Public position “Check if I fit” links to generic `/signup` without preserving `roleId`.
8. Error/not-found recovery returns to the coming-soon root instead of a context-aware account/public parent.
9. Company/provider/admin management screens expose many tasks at once.
10. Public/static/live career catalogue sources can drift.

## Suggested work order for the next implementation phase

1. Define the canonical user journeys and route transitions.
2. Introduce provider-agnostic LLM configuration while preserving the validated extraction contract.
3. Restore public entry CTAs and deep-link preservation.
4. Refactor applicant pathway presentation into progressive stages with explicit return actions.
5. Refactor dense management pages into task-oriented sections/routes.
6. Add end-to-end CLI/headless HTTP coverage for the journey and processor-provider matrix.

## Confidence

Confidence in this repository snapshot: 96%. The remaining uncertainty is external runtime state—Supabase contents, Vercel configuration, and whether any processor/model instance is currently running—which cannot be established from source alone without live environment checks.
