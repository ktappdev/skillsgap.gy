# `/company/invitations/[token]`

Source: `src/app/company/invitations/[token]/page.tsx`; acceptance: `src/lib/company/team-actions.ts`.

Requires sign-in while preserving the invitation URL through login, company signup, password recovery, and authentication errors. Shape-validated tokens are hashed; the page and database check expiry, revocation, one-time use, invited email, and company approval. Invalid or wrong-email invitations display the same non-disclosing message. Sign out and retry returns to the private invitation.

New recruiter memberships require a durable company-purpose profile. An invited applicant/provider account receives a distinct message explaining the separate-account requirement. Existing memberships remain valid. The RPC keeps its signature and the unique membership constraint prevents joining two companies during simultaneous acceptance. Owners retain invitation and removal privileges.

The migration `20260922150130_require_company_account_for_recruiter_invitation.sql` must be deployed to enforce the new purpose boundary in the database. It changes no existing profiles or memberships. Regression SQL is in `supabase/tests/company_recruiter_invitation_test.sql`; the live verification script is `scripts/check-recruiter-invitations.mjs`.

Back: `← skillsgap.gy` → `/`.
