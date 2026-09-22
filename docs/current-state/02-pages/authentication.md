# Authentication pages

## Shared shell

Source: `src/app/(auth)/layout.tsx:4`

Auth pages use a centered card on the background, with the logo linking home. Applicant signup adds a two-column pitch panel with the overhead offshore illustration and a short explanation of the skills-to-training pathway; login and company/provider auth forms remain compact. The shell does not provide an explicit back link or a role-selection breadcrumb.

## `/login`

Source: `src/app/(auth)/login/page.tsx:15`

Renders `AuthForm` in login mode after redirecting an already-authenticated user to their resolved account home. A safe `next` path is preserved. The form owns email/password sign-in and links to the relevant account creation and password-reset routes. Demo login buttons render only when `NEXT_PUBLIC_DEMO_LOGIN_ENABLED=true`; OAuth buttons are present through `OAuthButtons` if configured in the component.

## `/signup`

Source: `src/app/(auth)/signup/page.tsx:15`

Renders `AuthForm` in applicant/default signup mode. It collects email, password, full name, and optional username. Successful email confirmation returns through `/auth/callback`; an already-authenticated user is redirected to their account home.

## `/signup/company`

Source: `src/app/(auth)/signup/company/page.tsx:15`

Uses the same auth form with `audience="company"` and a safe company signup continuation. The signup itself creates an auth account; company access still requires the separate company verification request flow.

## `/signup/provider`

Source: `src/app/(auth)/signup/provider/page.tsx:15`

Uses the same auth form with `audience="provider"`. After account creation, the user is routed toward provider setup.

## `/forgot-password`

Source: `src/app/(auth)/forgot-password/page.tsx:7`

Renders `PasswordResetForm` in request mode. The server action sends a Supabase reset email and returns a deliberately generic success message so account existence is not disclosed.

## `/update-password`

Source: `src/app/(auth)/update-password/page.tsx:9`

Checks for a current Supabase user. Without a recovery session it redirects to `/auth/error?reason=recovery`; otherwise it renders the password form in update mode. Successful update redirects to the resolved account home.

## `/auth/error`

Source: `src/app/auth/error/page.tsx:7`

Shows one of two messages: expired reset link or a generic invalid confirmation link. Offers a recovery-specific action, a sign-in action, and a home action.

## `/auth/callback`

Source: `src/app/auth/callback/route.ts:7`

Reads the Supabase `code`, exchanges it for a session, applies a safe local `next` path or account-home fallback, and redirects. Missing/invalid codes go to `/auth/error`.

## Common UX observations

- The auth forms are deliberately compact and reusable.
- The route preserves deep-link intent, which is important for saving a no-account career plan.
- There is no explicit role chooser before signup; the audience-specific routes are discoverable only if a user reaches them.
