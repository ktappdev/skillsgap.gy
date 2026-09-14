# Company access and recruiter invitation pages

## `/company/request-access`

Source: `src/app/company/request-access/page.tsx:7`

Authenticated users can request company access by entering a required company name, optional HTTPS website, and a description of the company’s work. The server action creates a `pending` company record. A user with an existing membership sees status instead: pending or rejected. Approved membership redirects to `/company`.

The page uses a logo-adjacent `← skillsgap.gy` link, one card, inline form errors, and a note that approval unlocks roles and anonymized matches. Query parameters communicate submitted/duplicate/save errors.

## `/company/invitations/[token]`

Source: `src/app/company/invitations/[token]/page.tsx:11`

The user must be signed in; the safe return path preserves the invitation URL through login. The token is shape-checked and hashed before lookup. A valid invitation shows company name, signed-in email, expiry date, and an accept action. An invalid, expired, revoked, or email-mismatched invitation shows a generic unavailable state.

## Current UX observations

Both pages have a back-to-home link, but neither offers a clear path to the next relevant sign-in/signup action when the user is not authenticated; `requireUser` handles that by redirecting to login.
