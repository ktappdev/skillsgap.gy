# `/` — public home

Source: `src/app/page.tsx:57`

## Purpose

This is a static public entry point into the implemented product loop. It lets a visitor choose between matching existing experience and exploring a career direction without a CV.

## Visible structure

- Header with the SkillsGap.gy logo, Positions, Training, Build a route, FAQ, Sign in, and Get started links.
- Main proposition: move from existing skills to local opportunities and training.
- A short note explaining the rebuild after second place in the challenge.
- “What we are building” panel with three steps: recognize experience, find closest opportunities, close the gaps.
- Footer: `SkillsGap.gy` and `Skills → opportunities → training`.

## Interactions

The primary CTAs lead to applicant signup or the no-CV career explorer. Secondary links lead to public positions, training, and FAQ.

## Data and access

No database, auth, or server action dependency. It renders for everyone and is statically generated.

## Current UX implication

The old funnel gap is resolved in the current implementation. The remaining public risk is catalogue freshness, which depends on the connected position and training data.
