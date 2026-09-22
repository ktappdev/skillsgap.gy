# `/opportunities` and `/opportunities/[roleId]`

Sources: `src/app/opportunities/page.tsx:14`, `src/app/opportunities/[roleId]/page.tsx:35`

## List page

The public positions page uses `getPublicPositions`, which reads active roles and keeps only roles belonging to approved companies. It shows a shared public header, intro copy, count, and a two-column grid of `PositionCard` items. Each card exposes the role title, company, location/employment details, a short description, and links to the detail page. Empty state says there are no public positions and suggests building a career route.

## Detail page

The detail page validates the UUID and calls `getPublicPosition`. It shows:

- Public header with positions active.
- Demo/company label, role title, company, location, and employment type.
- Share button.
- `Compare my experience` links preserve the role through signup and return the applicant to the role-aware dashboard.
- A demo notice when `is_demo=true`.
- Role description.
- Requirements sorted with mandatory items first, each showing canonical qualification name, kind, optional minimum years, and Required/Preferred label.
- Optional approved-company website card.
- A final vacancy-freshness notice and `← All positions` footer link.

## Data and access

These pages are public and dynamic. They use a service-role server client through `src/lib/share/public-content.ts`; no private applicant data is returned.

## Current UX observations

The detail page has an explicit back-to-list link and the role-aware onboarding CTA retains the intended position context.
