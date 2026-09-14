# `/company/invitations/[token]`

Source: `src/app/company/invitations/[token]/page.tsx:11`

Requires sign-in while preserving the invitation URL. It hashes a shape-validated token and checks expiry/revocation/email through RLS. A valid invitation shows company, signed-in email, expiry, and accept control; invalid/unavailable invitations show a generic recovery message.

Back: `← skillsgap.gy` → `/`.
