# `/i-want-to-become` — career route builder

Source: `src/app/i-want-to-become/page.tsx:19`

## Purpose

Builds a useful career direction without requiring a CV or account. It combines guided starter routes with a wider occupation catalogue, optional interests, optional CSEC/CXC results, and a reviewable route plan.

## Entry state

- Header has a text logo, “No CV required”, and either `Sign in` or `My account` based on the viewer.
- `?pathway=...` preselects a route.
- `?save=pathway` renders the save handoff state after signup or login.
- The client restores an unfinished draft from `sessionStorage` unless a pathway was explicitly supplied.

## Three-step flow

1. **Direction** — Search the catalogue, filter All routes / Starter routes / Petroleum roles, and select one option. The first six options are shown until the user searches, filters, or expands the list.
2. **Strengths** — Select from seven interest chips or enter an optional 600-character note. The copy clearly says this is reflection and does not change eligibility.
3. **Starting point** — Enter CSEC/CXC subject and grade pairs manually, or choose a JPEG/PNG/WebP result-slip image up to 8 MB for optional automatic reading. The user must review the fields before building the route.

## Result states

- Guided starter routes show requirements, mandatory/preferred labels, minimum years, supporting providers, and toggles for requirements to put on the plan.
- Occupation routes show verified preparation subjects and ordered pathway actions, with progress stored in `sessionStorage` for the selected route.
- Occupation data comes from Supabase RPCs through public API routes, with a static curated fallback if the RPC is unavailable.
- Route actions carry official links and source/verification metadata.

## Save behavior

- Anonymous users can save by storing a fresh draft in `localStorage`, then navigating to `/signup?next=/i-want-to-become?save=pathway`.
- Applicant users save directly to `applicant_pathway_plans`.
- Non-applicant authenticated users are told routes can only be saved to an applicant account.
- Drafts are validated for shape, size, kind, freshness (24 hours), and canonical route/action membership before persistence.

## Back behavior

The step form has a visible `← Back` action: step 2 returns to step 1; step 3 returns to step 2. A progress nav and right-hand summary also let users revisit completed steps. Result plans have `Edit my starting point`.

## Current UX observations

- The three-step model is the clearest progressive-disclosure flow in the current product.
- On desktop, the form and a sticky summary are shown together; on small screens the summary follows the form.
- The page contains substantial copy and catalogue controls before the first interaction, but it is still understandable because only one step is active.
- A saved-route handoff can feel like a separate state/page; the error path provides “Build the route again”, but the original plan is only retained in browser storage.
