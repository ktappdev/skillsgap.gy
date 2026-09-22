# `/opportunities/[roleId]`

Source: `src/app/opportunities/[roleId]/page.tsx:35`

Validates a UUID and loads an active role at an approved company. Shows title/company/location/type, public share, signup CTAs, optional demo notice, description, required/preferred requirements, employer site, freshness warning, and `← All positions`.

Current journey note: `Compare my experience` preserves the public role through signup and returns the applicant to `/dashboard?roleId=...` so the role remains visible while the profile is built.
