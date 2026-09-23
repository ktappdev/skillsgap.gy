# Company pages

All company workspace pages require an approved company member through `requireApprovedCompanyMember`. They share `ManagementNav` with five horizontally scrollable links: Overview, Roles, Candidates, Job fairs, Team.

## `/company`

Source: `src/app/(app)/company/page.tsx:4`

Shows active-role count, current-match count, open-slot count, a link to candidates, and a privacy explanation that identity/CV data appears only after applicant consent. The owner can edit the company’s public profile from this page; recruiters receive a clear explanation that profile ownership stays with the owner.

## `/company/jobs`

Source: `src/app/(app)/company/jobs/page.tsx:6`

Loads the company’s roles, active qualification taxonomy, and active career occupations. `RoleEditor` creates and edits roles with title, description, location, employment type, interview threshold, and optional occupation mapping. It toggles roles between draft, active, and archived states and manages requirements with qualification, kind, weight, minimum years, and mandatory flag. The database guard controls whether an active role is publishable/matchable; canonical requirements continue to drive matching and training recommendations.

There is no role-detail URL: creation and requirements are managed inline in the page.

## `/company/candidates`

Source: `src/app/(app)/company/candidates/page.tsx:10`

Loads active roles, current matches, gap counts, applications, direct invitations, role-specific consents, and consented profiles. Candidates are anonymized and numbered until consent. The company can see match score and remaining gaps; applied candidates can receive a direct interview invitation. Consented candidates expose name/phone and a temporary signed CV link.

## `/company/job-fairs`

Source: `src/app/(app)/company/job-fairs/page.tsx:6`

`SlotManager` creates fairs with name, location, start, and end, toggles draft/open/closed, and adds 15-minute slots in Guyana time. Opening a fair triggers database-side eligible-candidate invitation behavior.

## `/company/team`

Source: `src/app/(app)/company/team/page.tsx:8`

Owners can invite recruiters by email and manage pending invitations; owners can remove recruiters. Recruiters can view the team but see an explanation that only the owner can change access. Invitation URLs are copied from the client after the server action returns them.

## Current UX observations

The company area has a coherent secondary nav, but each page is an admin-style management surface with many controls visible at once. The role editor and slot manager are especially form-dense. No page provides a contextual back action beyond the persistent logo/home and nav.
