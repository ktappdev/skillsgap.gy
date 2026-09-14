# `/update-password`

Source: `src/app/(auth)/update-password/page.tsx:9`; UI: `src/components/auth/password-reset-form.tsx`

Requires a current recovery/auth session. Without one it redirects to `/auth/error?reason=recovery`. With one it collects and confirms a new password, then redirects to the resolved account home.

Back: shared logo → `/`.
