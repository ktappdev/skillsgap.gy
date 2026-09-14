# Admin pages

All admin pages call `requirePlatformAdmin` and share `ManagementNav` with Overview, Companies, Qualifications, Training, and Career guidance.

## `/admin`

Source: `src/app/(app)/admin/page.tsx:5`

Landing page with a demo reset card and four management cards. The reset is a guarded hackathon-only operation requiring the configured demo applicant and password `reset1`; it rebuilds deterministic fallback data.

## `/admin/companies`

Source: `src/app/(app)/admin/companies/page.tsx:5`

Loads pending companies and passes them to `CompanyApprovals`, where an admin can approve or decline each request. Approved companies can post roles and invite matched applicants.

## `/admin/qualifications`

Source: `src/app/(app)/admin/qualifications/page.tsx:5`

Loads all qualifications and aliases. `TaxonomyManager` adds a canonical qualification, edits name/category/description/active state, and maps aliases. This taxonomy controls model candidate slugs and role requirements, so changes have matching consequences.

## `/admin/training`

Source: `src/app/(app)/admin/training/page.tsx:5`

`TrainingManager` adds providers, programs, and program-to-qualification outcomes, and toggles provider verification. Public training requires an active program and verified provider; a role gap’s training pathway also requires a matching outcome.

## `/admin/career-guidance`

Source: `src/app/(app)/admin/career-guidance/page.tsx:4`

`CareerGuidanceManager` selects an occupation, edits its industry-transfer summary, adds preparation subjects with sources, and adds/edits/toggles/ verifies ordered pathway actions. Only active and verified actions are public. The page is the operational editor for the no-CV career explorer catalogue.

## Current UX observations

Admin pages are powerful but dense. `CareerGuidanceManager` and `TrainingManager` combine selection, creation, editing, verification, and publication state in one screen. The nav is the primary way out; there are no scoped back links or staged workflows.
