# `/signup/company`

Source: `src/app/(auth)/signup/company/page.tsx`; state: `src/lib/auth/company-state.ts`; UI: `src/components/auth/auth-form.tsx`.

Discoverable from the shared footer and company FAQ. Email/password signup records the durable company account purpose. Owners create a personal employer account, request a company workspace, then invite recruiters after administrator approval. Recruiters start from a private invitation; there is no public recruiter registration.

Authenticated approved members return to `/company`; pending/rejected company accounts return to `/company/request-access`. Valid invitation continuations take precedence so they can be accepted after signup. Applicant/provider accounts see a separate-company-account boundary with sign-out and return-to-workspace choices. Existing memberships remain valid regardless of historical account purpose. Auth/database lookup failures show a retry action rather than treating the user as a new company.

Company return actions accept only known company routes and valid invitation tokens. Request forms retain entered fields after validation/database failures, preserve their return path when sign-in expires, and treat repeated submissions as idempotent. Existing company listings require administrator handling; they cannot be claimed automatically.

Back: logo → `/`.
