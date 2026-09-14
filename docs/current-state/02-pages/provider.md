# Provider pages

## `/provider/setup`

Source: `src/app/provider/setup/page.tsx:9`

Requires a signed-in user. If the user already owns a provider, it redirects to `/provider`. Otherwise it shows a form for provider name, location, optional phone, optional HTTPS contact URL, and optional description. A new provider is always unverified; an administrator must verify it before public visibility.

The page has a home logo link but no explicit cancel/back action to return to the previous signup context.

## `/provider`

Source: `src/app/(app)/provider/page.tsx:5`

Requires a provider owner. Shows provider name, Verified/Pending verification pill, provider navigation, profile editor, and a program count. The owner can edit the five profile fields but cannot change verification status.

## `/provider/programs`

Source: `src/app/(app)/provider/programs/page.tsx:7`

Requires a provider owner. Loads that provider’s programs, outcomes, active qualifications, and aliases. `ProviderProgramManager` supports:

- Create and edit program name, description, duration, and HTTPS enrollment URL.
- Toggle program active/inactive.
- Search and map qualification outcomes.
- Remove mapped outcomes.
- Verified providers can create a qualification and map it to a program.

Unverified providers can edit their workspace, but their provider/programs remain unavailable from public verified content until approved.

## Current UX observations

Programs are managed on one dense page. The page uses editable cards and progressively reveals outcome actions inside each program, but a provider with many programs can still face a long scroll and many simultaneous controls.
