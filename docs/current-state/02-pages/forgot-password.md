# `/forgot-password`

Source: `src/app/(auth)/forgot-password/page.tsx:7`; UI: `src/components/auth/password-reset-form.tsx`

Collects an email and sends a Supabase password-reset message. Success is intentionally generic: it does not disclose whether an account exists. The reset link targets `/auth/callback?next=/update-password`.

Back: shared logo → `/`.
