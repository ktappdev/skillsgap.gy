# Company, provider, and admin management features

## Company workspace

Company access starts with a pending request containing the company’s public profile details: name, website, sector, operating location, public phone, and description. Admin approval changes the company to approved and unlocks the company workspace. The owner can update that public profile after approval and can invite recruiters using expiring hashed-token invitations. Owners control recruiter removal/revocation; recruiters can use the workspace but cannot manage team access or alter the company profile.

Company role management is inline: create or edit a role with public details, optionally map it to the career catalogue, add weighted canonical requirements, then activate/archive. Requirement changes re-run the existing matching pipeline for active roles, while occupation mappings give downstream career guidance a stable link. The database trigger/guard rejects unsafe active roles. Job-fair management is likewise inline, with Guyana-time parsing and 15-minute slot creation.

## Provider workspace

A signed-in user can own one provider. Provider self-setup creates an unverified provider. The owner edits profile fields, creates/edits/toggles programs, and maps outcomes. Verified providers have the additional ability to create active qualifications. Public visibility remains controlled by admin/provider verification and program active state.

## Admin workspace

Admins verify companies and providers, maintain the qualification taxonomy and aliases, map training outcomes, and maintain sourced career guidance. The admin area also contains the demo fallback reset.

## Current risks

- Many operational workflows use buttons and inline local state with no route-level confirmation page. Refresh/revalidation is the primary consistency mechanism.
- The same taxonomy is used by extraction, matching, training outcomes, and career guidance. Admin edits are high-impact but the UI gives limited dependency context.
- The demo reset is intentionally powerful and should remain visibly separated from normal operations as the product returns to active use.
