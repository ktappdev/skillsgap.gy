# `/login`

Source: `src/app/(auth)/login/page.tsx:15`; UI: `src/components/auth/auth-form.tsx`

Redirects authenticated users to their account home, preserves a safe `next` path, and renders the reusable login form. The form submits email/password to Supabase, exposes links to signup and password reset, and may show demo/OAuth controls depending on configuration. Invalid credentials are converted to user-safe messages.

Back: logo → `/`. There is no explicit “back to previous page” control; deep-link return is handled after successful sign-in.
