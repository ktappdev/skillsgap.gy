# `/auth/callback`

Source: `src/app/auth/callback/route.ts:7`

GET route for Supabase auth code exchange. It reads `code`, validates `next` as a local safe path, exchanges the code for a session, resolves account home when needed, and redirects. Any failure redirects to `/auth/error`.
