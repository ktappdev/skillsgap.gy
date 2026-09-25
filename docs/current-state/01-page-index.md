# Page and route index

The detailed one-to-one page files live in [`02-pages/`](./02-pages/). Area overview files such as `applicant.md`, `company.md`, and `authentication.md` summarize related routes; the route-specific files use names such as `applicant-pathway.md` and `company-candidates.md`.

## Public and auth pages

| Route | Purpose | Source |
| --- | --- | --- |
| `/` | Coming-soon product landing page | `src/app/page.tsx:57` |
| `/faq` | FAQ about CVs, matching, privacy, training, and employers | `src/app/faq/page.tsx:89` |
| `/login` | Email/password sign-in, optional demo buttons, optional OAuth buttons | `src/app/(auth)/login/page.tsx:15` |
| `/signup` | Applicant account creation | `src/app/(auth)/signup/page.tsx:15` |
| `/signup/company` | Company-audience account creation | `src/app/(auth)/signup/company/page.tsx:15` |
| `/signup/provider` | Training-provider account creation | `src/app/(auth)/signup/provider/page.tsx:15` |
| `/forgot-password` | Request a password-reset email | `src/app/(auth)/forgot-password/page.tsx:7` |
| `/update-password` | Set a new password from a valid recovery session | `src/app/(auth)/update-password/page.tsx:9` |
| `/auth/error` | Expired/invalid auth-link state | `src/app/auth/error/page.tsx:7` |
| `/auth/callback` | Exchanges Supabase auth code and redirects | `src/app/auth/callback/route.ts:7` |
| `/i-want-to-become` | No-account career route builder | `src/app/i-want-to-become/page.tsx:19` |
| `/opportunities` | Public list of active approved-company positions | `src/app/opportunities/page.tsx:14` |
| `/opportunities/[roleId]` | Public position detail and share page | `src/app/opportunities/[roleId]/page.tsx:35` |
| `/training` | Public list of verified training programs | `src/app/training/page.tsx:14` |
| `/training/[programId]` | Public course detail and share page | `src/app/training/[programId]/page.tsx:43` |
| `/company/request-access` | Company verification request/status page | `src/app/company/request-access/page.tsx:7` |
| `/company/invitations/[token]` | Recruiter invitation acceptance page | `src/app/company/invitations/[token]/page.tsx:11` |
| `/provider/setup` | Provider self-service setup page | `src/app/provider/setup/page.tsx:9` |

## Applicant pages

| Route | Purpose | Source |
| --- | --- | --- |
| `/dashboard/overview` | Summary dashboard with stage cards, metrics, top matches, and next step | `src/app/(app)/dashboard/overview/page.tsx:10` |
| `/dashboard` | Detailed CV, review, match, work-history, and saved-route workspace | `src/app/(app)/dashboard/page.tsx:25` |
| `/matches/[matchId]` | One applicant match with eligibility, strengths, gaps, training, share, and apply | `src/app/(app)/matches/[matchId]/page.tsx:12` |
| `/interviews` | Fair invitations, direct invitations, and slot booking | `src/app/(app)/interviews/page.tsx:8` |

## Company pages

| Route | Purpose | Source |
| --- | --- | --- |
| `/company` | Company metrics and recruiting overview | `src/app/(app)/company/page.tsx:4` |
| `/company/jobs` | Create draft roles, toggle status, and add requirements | `src/app/(app)/company/jobs/page.tsx:6` |
| `/company/candidates` | Ranked anonymized/current matches, consented profile/CV access, applications, interviews | `src/app/(app)/company/candidates/page.tsx:10` |
| `/company/job-fairs` | Create/open/close fairs and add 15-minute slots | `src/app/(app)/company/job-fairs/page.tsx:6` |
| `/company/team` | Invite/revoke/remove company members | `src/app/(app)/company/team/page.tsx:8` |

## Provider pages

| Route | Purpose | Source |
| --- | --- | --- |
| `/provider` | Provider profile editing and verification state | `src/app/(app)/provider/page.tsx:5` |
| `/provider/programs` | Program details, active state, outcome mapping, and qualification creation | `src/app/(app)/provider/programs/page.tsx:7` |

## Admin pages

| Route | Purpose | Source |
| --- | --- | --- |
| `/admin` | Admin landing page and demo reset | `src/app/(app)/admin/page.tsx:5` |
| `/admin/companies` | Approve/reject company requests | `src/app/(app)/admin/companies/page.tsx:5` |
| `/admin/qualifications` | Manage active qualification taxonomy and aliases | `src/app/(app)/admin/qualifications/page.tsx:5` |
| `/admin/training` | Manage providers, programs, outcomes, and provider verification | `src/app/(app)/admin/training/page.tsx:5` |
| `/admin/career-guidance` | Manage occupation summaries, preparation subjects, and pathway actions | `src/app/(app)/admin/career-guidance/page.tsx:4` |

## API routes

| Route | Contract |
| --- | --- |
| `GET /api/i-want-to-become/occupations` | Returns validated public occupations from Supabase RPC, falling back to the static catalogue. |
| `GET /api/i-want-to-become/occupations/[slug]` | Returns a validated live occupation pathway, or a static fallback. |
| `POST /api/i-want-to-become/slip` | Validates/rate-limits a result-slip image and optionally proxies it to the configured processor. |
| `POST /api/i-want-to-become/skill-preview` | Validates and quota-limits an anonymous skill description, then returns matched roles, gaps, and training without a score. |

## Global states

- `src/app/not-found.tsx` handles invalid dynamic pages and missing routes.
- `src/app/error.tsx` provides a retry/home boundary for unexpected rendering errors.
- `src/app/(app)/dashboard/loading.tsx` provides the dashboard loading state.
- `src/app/(app)/layout.tsx` supplies the authenticated shell, account-aware navigation, and sign-out action.
- `src/app/(auth)/layout.tsx` supplies the centered auth shell.
