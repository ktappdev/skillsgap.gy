# Data and backend snapshot

Primary sources: `src/lib/supabase/database.types.ts`, `supabase/migrations/`, `services/processor/`

## Core tables

| Area | Tables |
| --- | --- |
| Identity | `profiles`, `platform_admins`, `company_members`, `companies`, `company_recruiter_invitations` |
| Taxonomy/guidance | `qualifications`, `qualification_aliases`, `occupations`, `occupation_aliases`, `local_content_categories`, `occupation_local_content_categories`, `career_preparation_subjects`, `occupation_pathway_actions` |
| Applicant | `applicant_pathway_plans`, `resumes`, `processing_jobs`, `applicant_qualifications`, `resume_extraction_findings`, `resume_extraction_finding_candidates`, `applicant_experience`, `applicant_contact_suggestions` |
| Marketplace | `job_roles`, `job_requirements`, `training_providers`, `training_programs`, `training_program_outcomes` |
| Matching/recruiting | `job_matches`, `match_gaps`, `job_applications`, `candidate_consents`, `job_fairs`, `interview_slots`, `interview_invitations`, `interview_bookings` |

## Important RPCs

- `claim_processing_job`, `apply_resume_extraction_with_contact_details`, `fail_processing_job`, and `apply_match_recalculation` coordinate durable processing.
- `apply_contact_suggestion` and `dismiss_contact_suggestion` let an applicant review CV-derived contact details without giving the processor direct profile-write behavior.
- `get_active_extraction_taxonomy` provides active qualifications/aliases to the processor.
- `confirm_extraction_finding` and `reject_extraction_finding` keep applicant confirmation explicit.
- `clear_applicant_pathway` resets applicant-derived records.
- `get_consented_candidate_profile`, `get_consented_resume_path`, and `get_consented_candidate_resume_path` enforce privacy boundaries.
- `get_public_occupations` and `get_public_occupation_pathway` expose curated public career data.
- `accept_company_recruiter_invitation` handles hashed invitation acceptance.
- `consume_skill_preview` atomically claims one anonymous-preview slot for a visitor and for the day, returning the remaining allowance or a denial reason; the private counter tables it owns are readable only through it.

## RLS and authorization model

The server actions use the authenticated Supabase client for user-scoped writes. Admin-only and company/provider ownership checks are performed both in application code and through database policies/functions. The service-role client is used only for narrowly scoped server operations such as deleting Storage objects and signing a consented CV URL.

## Processing state

`resumes` tracks uploaded/processing/processed/failed/archived. `processing_jobs` tracks queued/processing/completed/failed and separates resume analysis from match recalculation. A database webhook sends queued resume jobs to the external Go processor; the processor also polls queued work for recovery.

## Match visibility

Applicant queries filter current matches to active roles at approved companies, then slice to three. Company candidates query active company roles and current matches. Public positions do not expose match data.

## Schema evolution

The repository has a long, timestamped migration history under `supabase/migrations`; `supabase/seed.sql` provides clean-reset seed data. The repository instructions require any new pathway to be represented in both seed and a migration, followed by dry-run/lint/readiness checks before deployment.
