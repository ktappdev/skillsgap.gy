# SkillsGap processor

The processor is the private Thunder Compute coordinator. It accepts a lightweight Supabase webhook, claims durable jobs through Supabase REST RPCs, reads a private CV, extracts page-aware text, and persists validated structured facts. It never logs CV text, page images, model input/output, names, email addresses, or phone numbers.

## Runtime dependencies

- Go 1.22+
- Poppler `pdfinfo`, `pdftotext`, and `pdftoppm` for validation, native text, and private page rendering
- PP-StructureV3 OCR at `127.0.0.1:8090`
- vLLM serving Qwen3.6-35B-A3B at `127.0.0.1:8000/v1`

Required environment variables:

```text
WEBHOOK_SECRET=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OCR_SERVICE_SECRET=
VLLM_API_KEY=
```

Optional settings are `PORT` (default `8080`), `OCR_URL`, `VLLM_URL`, `VLLM_MODEL`, and `PROCESSOR_SCRATCH_DIR` (default `/ephemeral/skillsgap-processor`). `VLLM_MODEL` must match the identifier returned by the local model-discovery endpoint.

## Supabase RPC contract

The worker calls three service-role-only RPCs:

- `claim_processing_job(processing_job_id uuid)` atomically changes a queued/retryable job to processing and returns exactly one row with `id`, `resume_id`, `applicant_id`, `kind`, `storage_path`, and `attempts`; no row means another worker already owns it.
- `apply_resume_extraction(job_id uuid, extraction jsonb)` persists the validated profile, recalculates matches, and marks the job completed in one transaction. The database resolves extracted names to canonical qualifications and calculates scores; the model never scores candidates.
- `apply_match_recalculation(job_id uuid)` recalculates a completed applicant after they confirm a qualification.
- `fail_processing_job(processing_job_id uuid, safe_error_message text, terminal_failure boolean)` applies the retry limit, immediately stops permanent document failures, and stores only safe applicant-facing error text.

The poller reads queued IDs and claims older-than-15-minute processing jobs from `processing_jobs`; webhook requests are merely fast delivery signals. Each CV is downloaded from the private `resumes` bucket using `resumes.storage_path` when the claim response does not include it. A per-job processing context times out after 10 minutes.

The document route is deterministic: readable page text uses Qwen's text path; unreadable pages use PP-StructureV3; pages with unusable text, risky table/column layout, or low-confidence facts are rendered at 144 DPI for a complete Qwen vision-verification pass. PDF size is capped at 15 MB, page count at eight, extracted text at 100,000 characters, and rendered image bytes at 20 MB. Permanent document errors fail immediately; transient service errors retain the three-attempt retry policy.

The webhook handler accepts either the configured compact body `{ "job_id": "…" }` or the standard Supabase Database Webhook envelope and reads only `record.id`. It never trusts or logs the rest of the event payload.

## Local verification

```bash
go test ./...
go vet ./...
go build ./...
```
