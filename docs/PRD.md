# SkillsGap.gy Product Requirements Document

**Version:** 1.2
**Build target:** 72-hour hackathon MVP
**Product loop:** skills → opportunities → gaps → training → interview
**Extraction decision:** Qwen3.6-35B-A3B for text and selective vision verification, with PP-StructureV3 as the OCR/layout fallback

## 1. Product Summary

SkillsGap.gy is a career-transition engine for Guyana's oil-and-gas local-content opportunity. It does not ask a person to guess the right job title. Instead, it reads their existing experience, finds the roles they are closest to, explains every missing requirement, and shows a credible route to close the gap.

The MVP must demonstrate one complete outcome: a worker uploads a CV, receives their best-fit oil-and-gas opportunities, understands the qualifications they lack, finds local training, and becomes eligible to claim an interview slot after meeting a company's rules.

### Success criteria

- An applicant can complete the full CV-to-roadmap flow without choosing a target role first.
- A company can publish a role, define requirements and a threshold, create a job fair, and view its matched talent pool.
- A super admin can approve a company and maintain the qualifications and training information that make recommendations trustworthy.
- CVs, names, contact information, and extracted evidence remain private until the applicant consents to share them.
- The live demo processes at least one representative PDF end to end, with a prepared fallback account in case inference infrastructure fails.

### In scope

- Applicant, company, and super-admin workflows.
- Private PDF CV uploads and asynchronous processing.
- Native PDF text extraction, PP-StructureV3 OCR/layout fallback, selective local vision verification, and deterministic matching.
- Curated Guyana-focused demonstration data plus admin CRUD.
- In-app interview invitations and 15-minute slot booking.

### Out of scope for the MVP

- Job scraping, third-party job feeds, payments, billing, and email delivery.
- OpenRouter or any hosted LLM provider.
- Multi-language OCR, production-scale queues, Redis, and multi-server orchestration.
- Automated rejection, automated hiring decisions, and claims that a company formally endorses the platform.

## 2. Users and Core Journeys

| User | Goal | MVP capability |
| --- | --- | --- |
| Applicant | Find a realistic transition path | Upload CV, correct extracted profile, view top three roles, gaps, training, and invitations. |
| Company user | Find qualified local candidates without reviewing every CV | Request approval, manage roles and requirements, manage job fairs and slots, browse anonymized matches. |
| Super admin | Keep the ecosystem credible | Approve companies; maintain qualifications, aliases, training providers, courses, and demo data. |

### Applicant journey

1. Public signup creates an applicant account.
2. The applicant uploads one PDF CV to a private bucket.
3. The dashboard shows `Queued`, `Processing`, `Completed`, or `Needs attention`.
4. Once processing completes, the applicant reviews extracted qualifications, work history, and certifications. They can correct the data and trigger a recalculation.
5. The dashboard presents the three highest-ranked active roles from approved companies.
6. Each role explains transferable strengths, missing requirements, whether mandatory gates are met, and recommended local training.
7. When the applicant is eligible for an interview, an in-app invitation appears. The applicant selects one open 15-minute slot.
8. Confirming a booking grants that company consent-based access to the applicant's identity and CV for that role.

### Small-win progression

The applicant experience must reward momentum, especially before someone is fully qualified. It should make progress feel concrete rather than reducing the journey to a rejection-style score.

- After upload: confirm that their experience is being recognized and show processing progress.
- After extraction: show the number of skills, certifications, and years of experience found; make corrections feel like improving the profile, not fixing an error.
- After matching: lead with transferable strengths before listing missing requirements.
- After selecting a training program: mark that gap as `Plan started`.
- When a qualification is added or confirmed: show the match-score change and the next closest milestone.
- When all mandatory gaps are closed: celebrate interview eligibility and direct the applicant to available slots.

Use plain progress language such as `You are closer to Offshore Mechanical Technician` and `1 requirement left`. Do not add points, leaderboards, streaks, or collectible badges in the MVP.

### Company journey

1. A user chooses company signup, creates an account, and submits a company access request. It remains pending until a super admin approves the company.
2. Approval makes the requester the company owner. The owner can invite recruiters by email with a seven-day, one-time link; recruiters create or use their own password and join the same workspace.
3. An approved company member creates roles, adds weighted requirements, marks mandatory requirements, and sets a threshold. The default threshold is 75%.
4. The company creates a job fair and available 15-minute interview slots.
5. The company views candidates matched to its active roles using anonymized cards: match score, eligibility, and gap counts. Qualification evidence and work-history details remain hidden until consent; no name, contact information, or CV is visible at this stage.
6. When an applicant explicitly shares their profile or confirms an interview, the company may view the applicant's identity and obtain a time-limited CV link.

### Super-admin journey

1. Promote the first super-admin manually in Supabase before the demo.
2. Approve or reject company access requests.
3. Create and edit the canonical qualification taxonomy, aliases, training providers, training programs, and program outcomes.
4. Seed and maintain the demonstration jobs, requirements, and job fairs.

## 3. Functional Requirements

### Accounts and authorization

- Applicant and company signup are explicit entry points. Company signup continues directly to the access request.
- A super admin approves a company before its members can publish roles. Approval assigns the requester as its owner.
- An approved owner invites and removes recruiter accounts. Recruiters can manage company operations but cannot manage the team or platform administration.
- Each account has one primary space, resolved in the order platform admin, company, then applicant. An account can belong to only one company in the MVP.
- The hackathon demo uses email and password without a confirmation-email step; signup returns an authenticated session immediately. Password recovery remains email-dependent for future production use.
- Do not use editable Auth `user_metadata` for authorization. Platform-admin and company membership records are server-managed database records.
- The existing starter's publicly readable `profiles` policy must be removed. Profiles are private to their owners unless an applicant has granted consent for a specific company and role.

### CV upload and processing

- Accept PDF files only, with a 15 MB maximum file size.
- Store each CV in a private `resumes` Supabase Storage bucket at an owner-scoped path. The browser uses only the Supabase publishable key and Storage RLS policies.
- A successful upload creates a `resumes` record and a durable `processing_jobs` record. The job record, not the webhook, is the processing source of truth.
- A database webhook sends only the processing-job identifier to the Go API. It must return HTTP `202` quickly.
- The Go worker claims jobs atomically, retries transient failures up to three times, and records a safe failure message if processing cannot finish.
- A claim older than 15 minutes is recoverable by the poller, which prevents a crashed worker from leaving a job stuck forever; the worker itself times out after 10 minutes.
- The worker preserves page boundaries while attempting native PDF text extraction and applies deterministic quality checks for short, garbled, repetitive, or non-alphabetic output.
- When a page's native text is unusable, the worker calls PP-StructureV3 to recover ordered Markdown/page text.
- Qwen3.6-35B-A3B receives ordered text for the fast path. The worker selectively adds locally rendered page images when OCR is unusable, layout or table structure is risky, or the text-only extraction cannot produce adequately supported facts.
- A vision pass returns one complete replacement extraction. The worker never merges competing model outputs blindly, and a failed optional verification may fall back only to a schema-valid text extraction that remains pending applicant review.
- Processing rejects PDFs larger than 15 MB or eight pages, extracted text beyond 100,000 characters, and rendered vision payloads beyond 20 MB. It never scores a truncated CV.
- OCR and raw CV text never appear in application logs. Temporary CV files are stored on the Thunder instance's ephemeral scratch path and deleted immediately after processing.

### Profile extraction and correction

Qwen3.6-35B-A3B, served through vLLM, receives cleaned document text and, only when required, private page images. It returns strict JSON and must not calculate scores, decide eligibility, or invent qualifications.

The model boundary is deliberately narrow:

- PP-StructureV3 is responsible for OCR, reading order, and layout reconstruction; it does not decide what a person's experience means.
- The LLM extracts the worker's original wording, work history, qualifications, certifications, education, page evidence, and confidence. For each possible qualification it preserves the original term (for example, `Minibus diesel repair`) beside a canonical candidate (for example, `Mechanical Maintenance`); PostgreSQL accepts it only when that candidate or an approved alias resolves through the taxonomy.
- PostgreSQL is the single source of truth for canonical qualification mapping, weighted matching, mandatory gates, thresholds, and interview eligibility. Go only orchestrates extraction and submits validated facts.
- Any CV text is untrusted data. The extraction prompt must instruct the LLM to ignore instructions found inside the document and to report missing evidence rather than infer a fact. Terms that do not resolve safely are bounded, stored only in the applicant's processing summary, and never reach matching or company views.

### Model-selection gate

The processor keeps the served model name configurable through `VLLM_MODEL`. It must match the identifier returned by the Thunder vLLM server. Verify it before live processing:

| Gate | Pass condition | If it fails |
| --- | --- | --- |
| Model discovery | `GET /v1/models` reports the configured Qwen3.6-35B-A3B identifier. | Do not process live CVs until `VLLM_MODEL` agrees with the served model. |
| Structured text smoke test | A non-sensitive text prompt returns schema-valid extraction JSON. | Do not process live CVs; inspect the vLLM request and response format. |
| Vision smoke test | A synthetic page image is accepted through the OpenAI-compatible image request and returns schema-valid JSON. | Keep jobs queued and fix the multimodal serving configuration before processing scans. |
| Representative CV benchmark | Clean, scanned, mixed, two-column, and table-heavy fixtures meet the demo latency and accuracy bar without unsafe GPU memory pressure. | Use the prepared processed applicant while the private pipeline is repaired. |

The working path is hybrid: clean native text stays text-only; unreadable pages use PP-StructureV3; only uncertain pages are rendered for Qwen vision.

The extraction response contains:

- Work history and stated years of experience.
- Education and certifications.
- Canonical qualifications matched against the platform taxonomy.
- Unmapped terms that require applicant or admin review.
- Original CV wording, evidence snippets, page references, extraction method, and confidence for each extracted qualification.

The applicant can edit or remove extracted records and add qualifications. Every profile change creates a recalculation job.

### Opportunity discovery and matching

- Every completed applicant profile is evaluated against every active role from an approved company.
- Only the three highest-ranked roles appear as primary recommendations.
- A requirement has a canonical qualification, a weight from 1 through 5, an optional minimum experience value, and a `mandatory` flag.
- A requirement is satisfied only when the applicant has the required qualification and meets any minimum years. The MVP gives no partial credit.
- Extracted qualifications stay `pending_review`; only applicant-confirmed records can satisfy a requirement, contribute score weight, or create interview eligibility.
- The score is `round(100 × satisfied requirement weight ÷ total requirement weight)`.
- Missing mandatory requirements do not prevent a score from being shown, but they prevent interview eligibility.
- An applicant is interview-eligible only when the score meets the role threshold and all mandatory requirements are satisfied.
- Recalculate matches after applicant corrections and when an admin or company publishes or materially changes a role.

### Gaps and training roadmap

- Each unmatched requirement becomes a named gap: technical skill, certification, compliance, or experience.
- Training programs map to the qualifications they deliver.
- Each gap displays zero or more local training programs with provider name, location, description, duration, and contact or enrollment link when available.
- When no verified program exists, show `No verified local program listed yet` rather than an invented recommendation.

### Consent and interviews

- A company only sees anonymized candidate cards until consent exists.
- Applicants may explicitly share or revoke their profile for a role. Confirming an interview booking also creates consent for that company and role.
- After active consent, the approved company member can see the applicant's shared identity and request a ten-minute signed CV URL; the URL is never stored or exposed to other companies.
- A job fair belongs to one company and contains 15-minute slots.
- Claiming a slot must be atomic: an already-booked slot cannot be booked a second time.
- Invitations are in-app only. No email is required for the MVP.

## 4. Architecture and Service Contracts

### System map

```text
Next.js on Vercel
  └─ Supabase Auth, PostgreSQL, private Storage, Realtime
       └─ Database webhook → Thunder Go API :8080
            ├─ OCR service :8090 (localhost only)
            ├─ vLLM / Qwen3.6-35B-A3B :8000 (localhost only)
            └─ Supabase service APIs
```

Thunder port forwarding exposes only Go port `8080` using the generated HTTPS URL. The OCR and vLLM ports remain private. Services run under systemd, matching the existing Thunder runbooks:

- [Go API runbook](thundercompute/01-go-backend.md)
- [vLLM runbook](thundercompute/02-qwen3.6-35b-vllm.md)
- [OCR runbook](thundercompute/03-pp-structure-v3-ocr.md)

### External Go API

| Endpoint | Caller | Contract |
| --- | --- | --- |
| `GET /healthz` | Thunder health check / demo operator | Returns service readiness without exposing secrets or PII. |
| `POST /webhooks/resume` | Supabase Database Webhook | Requires `X-Webhook-Secret`; accepts `job_id` or the standard Supabase `record.id` envelope; returns `202` after validating the identifier. |

The webhook never contains CV bytes. The Go worker retrieves the job and CV from Supabase using a server-only credential. Duplicate webhook events are harmless because job claiming is idempotent.

### Internal services

| Service | Address | Contract |
| --- | --- | --- |
| PP-StructureV3 | `http://127.0.0.1:8090/parse` | Authenticated PDF input; returns ordered page text. |
| vLLM | `http://127.0.0.1:8000/v1/chat/completions` | Local API-key-protected Qwen request using text and optional base64 page images. |

Run one resume at a time until Qwen latency and GPU memory use are measured. Keep Qwen resident on the RTX 6000-class GPU and start PP-StructureV3 on CPU so the services do not compete for VRAM.

Vercel hosts only the Next.js application. CV bytes upload directly from the browser to private Supabase Storage. Cloudflare remains authoritative for `skillsgap.gy` DNS, using the exact record Vercel reports; Thunder HTTPS forwarding exposes only Go port `8080`, so the MVP does not use Caddy.

### Frontend routes

| Area | Routes | Purpose |
| --- | --- | --- |
| Public | `/`, `/login`, `/signup`, `/signup/company`, `/forgot-password`, `/update-password` | Explain the product and complete applicant, company, and recovery authentication. |
| Applicant | `/dashboard`, `/matches/[matchId]`, `/interviews` | Upload CV, review profile, explore recommendations, and book interviews. |
| Company | `/company/request-access`, `/company`, `/company/jobs`, `/company/candidates`, `/company/job-fairs`, `/company/team`, `/company/invitations/[token]` | Request approval, manage the shared workspace and recruiters, and browse authorized candidate data. |
| Admin | `/admin`, `/admin/companies`, `/admin/qualifications`, `/admin/training` | Approve companies and maintain trusted data. |

## 5. Data Model and Security

### Domain records

| Domain | Records |
| --- | --- |
| Identity and access | `profiles`, `platform_admins`, `companies`, `company_members`, `company_recruiter_invitations` |
| Shared taxonomy | `qualifications`, `qualification_aliases` |
| Jobs and training | `job_roles`, `job_requirements`, `training_providers`, `training_programs`, `training_program_outcomes` |
| Applicant processing | `resumes`, `processing_jobs`, `applicant_qualifications`, `applicant_experience` |
| Results | `job_matches`, `match_gaps`, `candidate_consents` |
| Interviews | `job_fairs`, `interview_slots`, `interview_invitations`, `interview_bookings` |

### Data ownership rules

- Applicants can read and edit only their own profile, resumes, extracted qualifications, matches, gaps, consents, invitations, and bookings.
- Approved company members can manage only their company's roles, requirements, job fairs, and slots.
- Only approved company owners can invite, revoke, or remove recruiter access.
- Company members can read anonymized matches and gap status for their company's roles. Qualification evidence, work-history details, identity, and signed CV URLs require active consent for that company and role.
- Super admins manage verification and shared taxonomy/training data.
- Service-role credentials are stored only on the Thunder Go server and server-side Vercel runtime. They are never prefixed with `NEXT_PUBLIC_` and never sent to a browser.
- Every exposed table has RLS enabled and explicit grants. `UPDATE` policies use both ownership checks and `WITH CHECK` constraints.
- Do not add privileged database functions to `public` unless their execution privileges are explicitly revoked from browser roles.

### Retention and privacy

- The current CV is private. A new upload becomes the current CV; older uploads remain owner-visible only and must be archived or removed during operator maintenance rather than exposed to companies.
- Preserve only the minimum booking record required to show a confirmed interview after the CV is removed.
- Do not persist raw OCR output beyond the processing job. Store structured facts, evidence snippets, and applicant corrections instead.
- Do not place names, email addresses, phone numbers, raw CV text, model prompts, or model responses in logs.

## 6. Seed Data

Seed data is for demonstration and must be visibly labeled as curated demo data unless independently verified before presentation.

- Three approved demonstration companies.
- Six active roles spanning mechanical, electrical, logistics, equipment, safety, and trainee pathways.
- Twenty-plus canonical qualifications with common aliases.
- Local training providers and programs mapped to BOSIET, hydraulic maintenance, heavy-equipment operations, electrical safety, and other seeded gaps.
- One approved company job fair with available 15-minute slots.
- The operator creates or promotes one super-admin, one company owner, one processed applicant fallback account, and one live applicant account after Auth is available. The SQL seed intentionally contains no passwords or Auth users.

## 7. Delivery Plan

### Day 1 — trusted foundation

- Replace the generic content model with domain tables, RLS, private Storage, and seed data.
- Add role-aware navigation, applicant signup, company access request, company approval, and admin taxonomy/training management.
- Verify Storage and table access with separate applicant, company, admin, and anonymous sessions.

### Day 2 — applicant intelligence loop

- Implement the Go worker, job claiming, page-aware native extraction, OCR fallback, selective vision verification, structured extraction, and validation.
- Build applicant upload, processing state, editable profile, matching, gaps, and training roadmap views.
- Exercise four representative fixtures through the full pipeline: a clean single-column PDF, a scanned PDF, a two-column PDF, and a table-heavy PDF. Record whether each uses native text or OCR text, along with latency and peak GPU memory.

### Day 3 — company, interview, and demo readiness

- Implement role/requirement management, anonymized company candidates, consent, job fairs, invitations, and atomic booking.
- Add responsive states, empty states, failure recovery, and deployment configuration.
- Run the demo rehearsal, capture the fallback account, and validate every service health endpoint.

## 8. Test and Acceptance Plan

### Automated and integration checks

- Unit-test matching weights, mandatory gates, top-three ordering, taxonomy aliasing, gap creation, training mappings, and slot-booking conflicts.
- Test JSON-schema validation for malformed model outputs, unsupported qualifications, missing evidence, prompt-like instructions embedded in CV text or images, and oversized extraction output.
- Test PDF-only, 15 MB, eight-page, 100,000-character, and 20 MB rendered-image limits; OCR/vision routing; retry behavior; duplicate webhooks; failed workers; unavailable OCR/vLLM; and temporary-file cleanup.
- Test RLS as anonymous, applicant, company, admin, and service roles. Confirm a company cannot read another company's roles, any unconsented applicant PII, or arbitrary Storage objects.
- Add end-to-end coverage for applicant upload-to-booking, company approval-to-candidate-view, and admin management flows.

### Manual acceptance checklist

- Applicant: sign up, upload CV, see progress update, correct extracted data, receive three matches, inspect gaps and training, and book a valid slot.
- Extraction routing: confirm a clean PDF uses native text and a scan invokes PP-StructureV3.
- Progression: confirm that upload, extraction, qualification confirmation, training-plan selection, and interview eligibility each produce a clear next-step message.
- Company: request approval, become approved, publish a role, define mandatory and weighted requirements, create slots, and see only anonymized candidates before consent.
- Admin: approve a company, create a qualification and training outcome, and confirm that a changed role recalculates matches.
- Privacy: verify that browser network calls never contain a service-role key; verify no CV or PII appears in Go/OCR/vLLM logs.
- Reliability: restart the Go process during a queued job and confirm the job can be retried safely.

## 9. Demo Script and Operations

### Demo sequence

1. Show the applicant's uploaded mechanic CV and the live processing state.
2. Reveal the extracted background and make one correction.
3. Show three unexpected but credible opportunity matches.
4. Open a target role to explain match score, missing BOSIET or hydraulics, and local training options.
5. Switch to the company view to show anonymized qualified local talent.
6. Demonstrate eligibility, invitation, consent, and a confirmed 15-minute interview slot.
7. Switch to admin to show company approval and training data governance.

The executable rehearsal, fallback setup, and recovery steps are in [`docs/demo-rehearsal.md`](demo-rehearsal.md). The prepared fallback uses curated qualifications and the same deterministic database rules as the product; it is never represented as a live CV or AI result.

### Health checklist before presentation

- Thunder vLLM (Qwen3.6-35B-A3B), OCR, and Go systemd services are active.
- `GET /healthz`, OCR health, vLLM model discovery, structured text, and synthetic image smoke tests succeed locally.
- Thunder HTTPS forwarding reaches only the Go health endpoint.
- Supabase Realtime is enabled for processing jobs and match/invitation updates.
- The fallback applicant account has completed matches and an available slot.
- The live demo CV is available and does not contain sensitive real-world data without consent.

### Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| OCR or vLLM fails during demo | Use the prepared processed applicant account; show health status and continue with live product data. |
| LLM endpoint is unavailable or unstable | Use the prepared processed applicant account; resume processing records a safe failure state. |
| GPU memory pressure | Keep one-worker concurrency and run OCR on CPU while Qwen remains resident on the RTX 6000-class GPU. |
| OCR and vision disagree | Use one complete vision-verified replacement extraction and require applicant confirmation; never combine assertions additively. |
| Malformed, encrypted, or excessive PDF | Reject safely without partial scoring and direct the applicant to upload an unlocked, shorter PDF or add qualifications manually. |
| Webhook delivery fails | Poll queued jobs as a recovery mechanism; jobs remain durable in Supabase. |
| Model extracts an incorrect fact | Require evidence and confidence, allow applicant correction, and keep scoring deterministic. |
| PII exposure | Private Storage, owner-scoped RLS, consent-gated company access, short-lived signed URLs, and redacted logs. |
| Seed data is mistaken for live data | Clearly label all demonstration listings and training details as curated demo data. |

## 10. Definition of Done

The MVP is ready when all three roles complete their core journeys, a private CV can move from upload through extraction and matching to an in-app interview booking, company visibility remains consent-gated, and the demo can recover from a non-critical inference-service failure using the prepared fallback account.

**Important takeaway:** SkillsGap.gy succeeds when it turns a worker's existing experience into a transparent, achievable path to a real opportunity—not when it merely produces a score.
