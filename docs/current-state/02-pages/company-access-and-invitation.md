# Company access and recruiter invitation pages

## `/company/request-access`

Source: `src/app/company/request-access/page.tsx:7`

Authenticated users can request company access by entering a required company name, optional HTTPS website, and a description of the company’s work. The server action creates a `pending` company record. A user with an existing membership sees status instead: pending or rejected. Approved membership redirects to `/company`, and accounts that are not company-purpose redirect to `/signup/company`; the same boundary is enforced in the database.

The page uses a logo-adjacent `← skillsgap.gy` link, one card, inline form errors, and a note that approval unlocks roles and anonymized matches. Submission errors stay in the form rather than the query string: `CompanyRequestForm` (`src/components/company/company-request-form.tsx`) renders the `{values,error,invalidField}` state returned by `submitCompanyAccess` (`src/lib/company/access-request-actions.ts`), so entered fields survive validation and database failures and only the success flag `?submitted=1` remains in the URL. Repeated submissions are idempotent, a rejected request owned by the signed-in user shows a resubmit form with the previous values, and a `23505` conflict on an existing listing returns a distinct message explaining that an administrator must arrange access and ownership.

## `/company/invitations/[token]`

Source: `src/app/company/invitations/[token]/page.tsx:13`

The user must be signed in; the safe return path preserves the invitation URL through login, company signup, password recovery, and authentication errors. The token is shape-checked and hashed before lookup, and the page checks invited email, expiry, revocation, one-time use, and company approval. A valid invitation shows company name, signed-in email, expiry date, and an accept action.

An invalid, expired, revoked, or email-mismatched invitation shows the same generic unavailable state. An applicant- or provider-purpose account that tries to accept sees a distinct message explaining that a separate company account is required, plus a `Sign out and retry with the invited company account` action (`src/lib/company/team-actions.ts`, `src/app/company/invitations/[token]/page.tsx`). New memberships require `profiles.account_type='company'`; existing memberships remain valid and the one-company rule still applies. The durable boundary ships in migration `20260922150130_require_company_account_for_recruiter_invitation.sql`.

## Current UX observations

Both pages have a back-to-home link, but neither offers a clear path to the next relevant sign-in/signup action when the user is not authenticated; `requireUser` handles that by redirecting to login.
