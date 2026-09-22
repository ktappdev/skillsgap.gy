# Verification and open issues

## Checks run for this snapshot

Run from the repository root unless noted:

- `pnpm test` — passed: 16 files, 64 tests.
- `pnpm typecheck` — passed.
- `pnpm lint` — passed.
- `pnpm build` — passed; Next reported 33 application routes, with public static routes and dynamic server-rendered routes as listed in [the page index](./01-page-index.md).
- `go test ./...` from `services/processor` — passed.

No dev server was started, and no browser/GUI testing was performed.

## Snapshot gaps and current resolution

1. **Resolved in checkpoint 86:** the root landing page now links into the working product.
2. The Go/model service is external and currently offline by user report; queued CV processing cannot complete without a processor.
3. **Resolved in checkpoint 85:** processor configuration uses `LLM_BASE_URL`, optional `LLM_API_KEY`, and `LLM_MODEL`; provider capability readiness is checked by the private readiness script.
4. **Resolved at the configuration boundary:** the same processor can target a compatible hosted or local endpoint, subject to the required vision and strict-schema capability check.
5. **Improved in checkpoint 86:** the applicant pathway now has explicit stage navigation, anchored sections, and return actions. The detailed page remains intentionally information-rich.
6. **Improved in checkpoint 86:** overview and detailed pathway navigation now have distinct labels and an explicit relationship.
7. **Resolved in checkpoint 86:** public position CTAs preserve `roleId` through signup.
8. **Resolved in checkpoint 86:** not-found and error recovery now offer context-appropriate public/product destinations.
9. **Still a scale opportunity:** management screens are functional but can be split into task-focused routes as the number of records grows.
10. **Still operational:** public/static/live career catalogue sources can drift and need an owner and verification cadence.

## Suggested work order for the next implementation phase

1. Keep the canonical user journeys and route transitions covered by headless/end-to-end checks.
2. Split dense management pages into task-focused sections when the catalogue grows.
3. Assign a verification owner and cadence to public career and training sources.
4. Add end-to-end CLI/headless HTTP coverage for the journey and processor-provider matrix.

## Confidence

Confidence in this repository snapshot: 96%. The remaining uncertainty is external runtime state—Supabase contents, Vercel configuration, and whether any processor/model instance is currently running—which cannot be established from source alone without live environment checks.
