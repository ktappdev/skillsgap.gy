# `/opportunities/[roleId]`

Source: `src/app/opportunities/[roleId]/page.tsx:35`

Validates a UUID and loads an active role at an approved company. Shows title/company/location/type, public share, signup CTAs, optional demo notice, description, required/preferred requirements, employer site, freshness warning, and `← All positions`.

Known journey issue: `Check if I fit` and `Find my route` currently use generic `/signup` and do not preserve `roleId`.
