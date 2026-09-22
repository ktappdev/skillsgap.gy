# `/faq` — FAQ

Source: `src/app/faq/page.tsx:89`

## Purpose

Explains what the product does, how CV reading and matching work, privacy boundaries, training freshness, provider participation, and company participation.

## Visible structure

- Shared public header with Positions, Training, Build a route, FAQ, account, and Get started links.
- Intro section: “A clearer way to understand the pathway.”
- Four expandable groups: Getting started; Your CV and matches; Privacy and trust; Training and employers.
- Each question is a native `<details>` disclosure with a plus icon that rotates when open.
- Bottom panel links to Build a route and public positions.

## Interactions

Questions open/close locally. The page also links visitors directly to the career explorer, positions, training, and account entry points.

## Data and access

All content is static. No auth or database dependency.

## Current UX implication

The previous paused-product copy and dead-end navigation were removed. Keep FAQ answers synchronized with changes to privacy, CV processing, matching, and training freshness.
