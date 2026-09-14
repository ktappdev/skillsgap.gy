# Public sharing feature

Sources: `src/components/shareable/`, `src/lib/share/`

## Shared content

Public position and course pages can be shared through `ShareButton`. The component supports the browser share API where available and falls back to copying a URL, with a status message. Share text is built by `src/lib/share/messages.ts`.

## Privacy boundary

Public position pages return only active roles and approved company details. Public course pages return only active programs and verified provider details. Applicant match pages share a public role URL, not the private applicant profile.

## Applicant profile sharing

`ShareProfileButton` is separate from public link sharing. It changes role-specific consent so the company can retrieve an allowed profile/CV path. The applicant can revoke the share.

## Current risks

The product uses “share” for both sending a public link and granting private company access. The distinction is technically enforced but should be made visually and verbally unmistakable in the next UI pass.
