# SkillsGap processor

The processor is the private Thunder Compute coordinator. It accepts a lightweight Supabase webhook, claims durable jobs through Supabase REST RPCs, loads the active qualification taxonomy, renders every page of a private CV, sends those page images plus the taxonomy vocabulary to Qwen vision, and persists validated structured facts. It never logs CV text, page images, model input/output, names, email addresses, or phone numbers.

## Runtime dependencies

- Go 1.22+
- Poppler `pdfinfo` and `pdftoppm` for PDF validation and private page rendering
- vLLM serving Qwen3.6-35B-A3B at `127.0.0.1:8000/v1`

Required environment variables:

```text
WEBHOOK_SECRET=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
VLLM_API_KEY=
```

Optional settings are `PORT` (default `8080`), `VLLM_URL`, `VLLM_MODEL`, and `PROCESSOR_SCRATCH_DIR` (default `/ephemeral/skillsgap-processor`). `VLLM_MODEL` must match the identifier returned by the local model-discovery endpoint. `OCR_URL` and `OCR_SERVICE_SECRET` remain supported only for a dormant rollback path; the active worker never calls OCR.

## Supabase RPC contract

The worker calls three service-role-only RPCs:

- `claim_processing_job(processing_job_id uuid)` atomically changes a queued/retryable job to processing and returns exactly one row with `id`, `resume_id`, `applicant_id`, `kind`, `storage_path`, and `attempts`; no row means another worker already owns it.
- `get_active_extraction_taxonomy()` returns the active qualification slugs, descriptions, and aliases to the private worker. It is service-role-only and is used to constrain Qwen's translation vocabulary.
- `apply_resume_extraction(job_id uuid, extraction jsonb)` persists the validated profile and pending taxonomy findings, recalculates matches from already-confirmed qualifications, and marks the job completed in one transaction. The database stores model options separately; the model never scores candidates.
- `confirm_extraction_finding(finding_id uuid, qualification_id uuid)` is an applicant-only RPC that turns a selected option (or explicit correction) into one confirmed qualification.
- `reject_extraction_finding(finding_id uuid)` lets the owning applicant dismiss a pending finding without affecting matching.
- `apply_match_recalculation(job_id uuid)` recalculates a completed applicant after they confirm a qualification.
- `fail_processing_job(processing_job_id uuid, safe_error_message text, terminal_failure boolean)` applies the retry limit, immediately stops permanent document failures, and stores only safe applicant-facing error text.

The poller reads queued IDs and claims older-than-15-minute processing jobs from `processing_jobs`; webhook requests are merely fast delivery signals. Each CV is downloaded from the private `resumes` bucket using `resumes.storage_path` when the claim response does not include it. A per-job processing context times out after 10 minutes.

The document route is deterministic: `pdfinfo` validates the file and page count, every page is rendered at 144 DPI, and one strict Qwen vision request receives the ordered page images plus a fresh active qualification taxonomy snapshot. Qwen returns one or two approved qualification slugs per evidence-backed finding; it never receives job requirements or calculates scores. PDF size is capped at 15 MB, page count at eight, and rendered image bytes at 20 MB. Permanent document errors fail immediately; transient service errors retain the three-attempt retry policy. Native text extraction and OCR are not active processing paths.

The webhook handler accepts either the configured compact body `{ "job_id": "…" }` or the standard Supabase Database Webhook envelope and reads only `record.id`. It never trusts or logs the rest of the event payload.

Production uses the repository migration `20260905221437_wire_processor_webhook.sql`
to notify `https://e2tpybmi-8080.thundercompute.net/webhooks/resume`. The trigger
sends only the job identifier; the header secret is stored in Supabase Vault and
the matching Thunder environment file.

## Local verification

```bash
go test ./...
go vet ./...
go build ./...
```

## Public CSEC/CXC result-slip reader

When `CSEC_SLIP_PROCESSOR_SECRET` is configured, the processor exposes `POST /public/csec-result-slip`. It is called only by the Next.js server using `X-CSEC-Slip-Secret`; browsers do not receive the Thunder URL or secret.

The endpoint accepts one JPEG, PNG, or WebP image up to 8 MB and returns only bounded `{subject, grade, confidence}` pairs. It never writes the slip to Supabase, does not create a processing job, and must not log image bytes, extracted text, identifiers, prompts, or model responses. The configured vLLM model must support image input and strict JSON schema output before this endpoint is enabled. The public manual-entry flow remains available when it is not enabled.
