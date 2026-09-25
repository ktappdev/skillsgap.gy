# SkillsGap processor

The processor is the private coordinator for applicant skill intake. It accepts a lightweight Supabase webhook, claims durable jobs through Supabase REST RPCs, loads the active qualification taxonomy, and persists validated structured facts. CV jobs render every page of a private CV and send those page images plus the taxonomy vocabulary to the configured vision model. Plain-language jobs send the applicant's own typed description to the same model with the same taxonomy. It never logs CV text, page images, descriptions, model input/output, names, email addresses, or phone numbers.

## Runtime dependencies

- Go 1.22+
- Poppler `pdfinfo` and `pdftoppm` for PDF validation and private page rendering
- An OpenAI-compatible model server with image input and strict JSON-schema output

Required environment variables:

```text
WEBHOOK_SECRET=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
LLM_BASE_URL=http://127.0.0.1:8000/v1
LLM_MODEL=
```

`LLM_BASE_URL` is the provider's API base URL, normally ending in `/v1`. The processor posts to `<LLM_BASE_URL>/chat/completions` and checks `<LLM_BASE_URL>/models` in the readiness script. `LLM_MODEL` must exactly match the model identifier served by that endpoint. `LLM_API_KEY` is optional: set it for hosted providers, or leave it empty for a keyless local server.

Every model request sets `reasoning_effort` to `none`; the OpenRouter API defines this as disabling reasoning where the selected model allows it. Models that require reasoning cannot meet this setting, so the readiness request also uses `none` and must succeed before live processing.

For example, a hosted OpenRouter setup uses a base URL such as `https://openrouter.ai/api/v1`, an API key, and the provider's exact model ID. A local llama.cpp setup can use `http://127.0.0.1:8080/v1`, an empty API key, and the model ID configured in the local server. If both processes run on one machine, give the Go processor a different `PORT` from the model server.

Other optional settings are `PORT` (default `8080`), `PROCESSOR_SCRATCH_DIR` (default `/ephemeral/skillsgap-processor`), `CSEC_SLIP_PROCESSOR_SECRET`, `SKILL_PREVIEW_SECRET`, `OCR_URL`, and `OCR_SERVICE_SECRET`. If `SKILL_PREVIEW_SECRET` is blank, the processor reuses `CSEC_SLIP_PROCESSOR_SECRET`; set the dedicated value only to use a separate shared secret. The web app similarly falls back to `CSEC_SLIP_PROCESSOR_URL` and `CSEC_SLIP_PROCESSOR_SECRET` when the dedicated skill-preview variables are blank. Both public routes stay unmounted and answer 404 while their effective secret is unset. `LLM_MAX_TAXONOMY_ENTRIES` sets the maximum active qualifications loaded for extraction; its built-in default is `2000`. Unset or whitespace-only values use the default. A configured value must be a positive integer, and invalid values stop startup with a configuration error. Changes take effect after the processor restarts. The OCR settings remain supported only for a dormant rollback path; the active worker never calls OCR.

## Supabase RPC contract

The worker calls these service-role-only RPCs:

- `claim_processing_job(processing_job_id uuid)` atomically changes a queued/retryable job to processing and returns exactly one row with `id`, `resume_id`, `applicant_id`, `kind`, `storage_path`, `attempts`, and `input_text`; `input_text` carries an applicant-authored description for `description_analysis` jobs and is null for CV jobs. No row means another worker already owns it.
- `get_active_extraction_taxonomy_snapshot(p_limit bigint)` returns one JSON object with the exact active count and up to `p_limit + 1` entries. The worker uses it to detect a catalogue larger than its configured limit without relying on the Data API's row limit. Snapshot responses have a dedicated 32 MiB decoding limit. `get_active_extraction_taxonomy()` remains available for compatibility.
- `apply_resume_extraction_with_contact_details(job_id uuid, extraction jsonb)` persists pending taxonomy findings, employment evidence, and private contact suggestions with page evidence, recalculates matches from already-confirmed qualifications, and marks the job completed in one transaction. Contact suggestions change no profile fields until the applicant applies them. The sign-in email remains separate, and CV contact email remains private until role-specific profile sharing. The database stores model options separately; the model never scores candidates.
- `apply_description_extraction(job_id uuid, extraction jsonb)` persists pending taxonomy findings for an applicant-authored description, records unmatched phrases as unmapped terms, recalculates matches from already-confirmed qualifications, and marks the job completed in one transaction. Text findings carry `evidence_method = 'text'` and page 0; they never touch a resume, employment, or contact fields.
- `confirm_extraction_finding(finding_id uuid, qualification_id uuid)` is an applicant-only RPC that turns a selected option (or explicit correction) into one confirmed qualification.
- `reject_extraction_finding(finding_id uuid)` lets the owning applicant dismiss a pending finding without affecting matching.
- `apply_match_recalculation(job_id uuid)` recalculates a completed applicant after they confirm a qualification.
- `fail_processing_job(processing_job_id uuid, safe_error_message text, terminal_failure boolean)` applies the retry limit, immediately stops permanent document failures, and stores only safe applicant-facing error text.

The poller reads queued IDs and claims older-than-15-minute processing jobs from `processing_jobs`; webhook requests are merely fast delivery signals. Each CV is downloaded from the private `resumes` bucket using `resumes.storage_path` when the claim response does not include it. A per-job processing context times out after 10 minutes.

The document route is deterministic: `pdfinfo` validates the file and page count, every page is rendered at 144 DPI, and one strict vision request receives the ordered page images plus a fresh active qualification taxonomy snapshot. The model returns one or two approved qualification slugs per evidence-backed finding; it never receives job requirements or calculates scores. PDF size is capped at 15 MB, page count at eight, and rendered image bytes at 20 MB. Permanent document errors fail immediately; transient service errors retain the three-attempt retry policy. Native text extraction and OCR are not active processing paths.

The description route reuses the same taxonomy snapshot and strict-schema request for `description_analysis` jobs. The applicant's typed text is sent as untrusted evidence, never instructions; the path returns findings and unmapped terms only, with `evidence_method = "text"` and page 0, and never reads a resume, employment, or contact. Descriptions are capped at 2000 characters by the database, and a partial unique index allows only one queued or processing description per applicant.

The webhook handler accepts either the configured compact body `{ "job_id": "…" }` or the standard Supabase Database Webhook envelope and reads only `record.id`. It never trusts or logs the rest of the event payload.

Set `skillsgap_processor_webhook_url` and `skillsgap_processor_webhook_secret` in each Supabase environment's Vault. The URL must be the processor's HTTPS `/webhooks/resume` endpoint. The trigger reads both values from Vault and sends only the job identifier; the header secret must match `WEBHOOK_SECRET` in that processor environment. The migration deliberately does not contain a deployment hostname or secret.

## Local verification

```bash
go test ./...
go vet ./...
go build ./...
```

The readiness check from the repository root verifies the configured model list, a one-pixel multimodal request, strict JSON output, and optionally the processor health endpoint:

```bash
node --env-file=.env.local scripts/check-vision-only-readiness.mjs
```

## Public CSEC/CXC result-slip reader

When `CSEC_SLIP_PROCESSOR_SECRET` is configured, the processor exposes `POST /public/csec-result-slip`. It is called only by the Next.js server using `X-CSEC-Slip-Secret`; browsers do not receive the processor URL or secret.

The endpoint accepts one JPEG, PNG, or WebP image up to 8 MB and returns only bounded `{subject, grade, confidence}` pairs. It never writes the slip to Supabase, does not create a processing job, and must not log image bytes, extracted text, identifiers, prompts, or model responses. The configured model must support image input and strict JSON-schema output before this endpoint is enabled. The public manual-entry flow remains available when it is not enabled.

## Public skill preview

When `SKILL_PREVIEW_SECRET` or `CSEC_SLIP_PROCESSOR_SECRET` is configured, the processor exposes `POST /public/skill-preview` for the anonymous signup preview. It is called only by the Next.js server using `X-Skill-Preview-Secret`; browsers do not receive the processor URL or secret. The configured model must support the strict JSON-schema text extraction (`description_analysis` output shape) before this endpoint is enabled, and the mount is skipped entirely when neither secret is set.

`/public/` is reachable over HTTPS with no other network gate, so the shared secret is the only thing separating these routes from the open internet: keep it long and random, hand it to no other client, and set it in one processor environment only. The skill-preview route may share the CSEC secret or use its dedicated override. A missing or wrong secret returns 401, preview text outside 10–300 characters returns 400, a burst returns 429 with `Retry-After`, and an unusable taxonomy or model returns 503.

The body is `{ "text": "…" }`, bounded to 64 KB and validated to 10–300 characters. Applicant descriptions remain separately capped at 2000 characters. The response is only `{ "findings": [ { "slugs": [...], "original_term": "…" } ], "unmapped_terms": [...] }`, capped at 50 findings and 50 unmapped terms. Employment and contact fields from the extraction are never returned, and the route persists nothing: no `processing_jobs` row, no findings, no unmapped-term write. The route keeps its own token bucket (5 requests, refilling at 20/minute) and its own four-request concurrency cap, separate from the CSEC slip route, and finishes inside 25 seconds.
