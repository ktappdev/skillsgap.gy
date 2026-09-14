# Global, loading, not-found, and error states

Sources: `src/app/not-found.tsx:3`, `src/app/error.tsx:10`, `src/app/(app)/dashboard/loading.tsx`

## Not found

`not-found.tsx` centers a 404 message, explains that a pathway may not exist, and offers `Go home`.

## Unexpected error

`error.tsx` is a client error boundary. It gives a plain-language temporary-problem message and offers `Try again` through Next’s reset callback or `Go home`.

## Dashboard loading

The dashboard has a route-level loading file for the server-rendered applicant workspace. It is intended to prevent a blank transition while progress is loaded.

## Current UX observations

Error recovery always exits to the root page, which is currently the coming-soon surface. For a signed-in user, a contextual return to the account home would preserve more journey continuity.
