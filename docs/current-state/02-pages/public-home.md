# `/` — public home

Source: `src/app/page.tsx:57`

## Purpose

This is currently a static coming-soon/under-construction landing page rather than an entry point into the live product.

## Visible structure

- Header with the SkillsGap.gy logo, an FAQ link, and an “In development” status pill.
- Decorative construction tape across the page.
- Second-place trophy treatment and “Innovation Challenge 2026 · Guyana” label.
- Main proposition: move from existing skills to local opportunities and training.
- A short note explaining the rebuild after second place in the challenge.
- “What we are building” panel with three steps: recognize experience, find closest opportunities, close the gaps.
- Footer: `SkillsGap.gy` and `Skills → opportunities → training`.

## Interactions

Only the FAQ link navigates. There is no visible sign-in, sign-up, career explorer, opportunities, training, or “start” CTA from this page.

## Data and access

No database, auth, or server action dependency. It renders for everyone and is statically generated.

## Current UX implication

The product loop is described but not entered. A returning user who lands at `/` cannot discover the authenticated journey from the page itself. This is the largest public-funnel gap in the current snapshot.
