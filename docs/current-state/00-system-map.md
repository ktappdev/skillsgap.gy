# System map

## Product loop

SkillsGap.gy is organized around this loop:

`existing experience → confirmed skills → ranked opportunities → missing requirements → training → applications/interviews`

There is a second, no-CV loop:

`career direction → interests and CSEC/CXC starting point → curated route → optional private save to applicant dashboard`

## Runtime boundaries

- Next.js 16 App Router serves public pages, authenticated pages, server actions, API routes, and the browser client.
- Supabase Auth owns sessions and password recovery.
- Supabase Postgres owns the product data, RLS policies, matching calculations, processing-job state, and most cross-record workflows through RPCs.
- Supabase Storage owns private CV files in the `resumes` bucket. The browser uploads directly to Storage, then registers the upload through a server action.
- `services/processor` is a separate Go worker. It polls or receives a webhook for queued jobs, downloads private PDFs from Supabase, renders pages, sends images to an OpenAI-compatible chat-completions endpoint, and writes validated results back through Supabase RPCs.
- `services/ocr` is a dormant Python rollback service. The active processor is vision-only and does not call it.
- The public CSEC/CXC result-slip reader is an optional Next.js-to-processor proxy. Manual entry remains available when the processor endpoint is not configured.

## Account spaces

Authenticated users are assigned a home by `resolveUserHome`:

| Priority | Account space | Home | Main navigation |
| --- | --- | --- | --- |
| 1 | Platform admin | `/admin` | Admin |
| 2 | Approved company member | `/company` | Company |
| 3 | Training provider owner | `/provider` | Provider |
| 4 | Pending/rejected company request | `/company/request-access` | Company access |
| 5 | Applicant/default | `/dashboard` | Dashboard, My pathway, Interviews |

The priority matters when one user has more than one relationship. Admin wins; an approved company membership wins over provider ownership.

## Match loop

1. Applicant uploads one private PDF CV.
2. The app creates a `resumes` row and a queued `processing_jobs` row.
3. The processor claims the job, validates the PDF, renders every page, loads the active qualification taxonomy, and requests a complete vision extraction.
4. The processor validates the model response and calls `apply_resume_extraction`.
5. Supabase stores pending findings and experience records. Pending findings do not count toward matches.
6. Applicant selects a taxonomy qualification for each finding or dismisses it.
7. Confirmation creates/updates confirmed qualifications and enqueues match recalculation.
8. PostgreSQL calculates weighted scores, mandatory gates, `job_matches`, and `match_gaps`.
9. The dashboard shows only the top three current matches at approved companies with active roles.

## Trust boundaries

- Browser-safe variables are limited to the Supabase public URL/key, site URL, and demo-login flag.
- Service-role credentials and processor/model credentials are server-only.
- Applicant CVs and unconsented applicant identities remain private.
- A company sees an anonymized candidate until the applicant grants role-specific consent or a fair-based interview path exposes the allowed information.
- Model output is treated as untrusted. Taxonomy slugs, evidence pages, methods, text lengths, counts, and numeric bounds are validated before persistence.

## Current product posture

- The product code is broad and feature-rich for a demo: applicant, company, provider, admin, public positions, public training, career explorer, sharing, applications, and interviews all exist.
- The root marketing surface intentionally says “In development” and “Under construction”; it does not currently link visitors into the product loop.
- The next requested direction is to restore a complete user journey, improve progressive disclosure and back navigation, and make the model endpoint configurable without tying the implementation to Thunder/vLLM naming.
