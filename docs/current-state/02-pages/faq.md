# `/faq` — FAQ

Source: `src/app/faq/page.tsx:89`

## Purpose

Explains what the product does, how CV reading and matching work, privacy boundaries, training freshness, provider participation, and company participation.

## Visible structure

- Logo header and “In development” pill.
- Intro section: “A clearer way to understand the pathway.”
- Four expandable groups: Getting started; Your CV and matches; Privacy and trust; Training and employers.
- Each question is a native `<details>` disclosure with a plus icon that rotates when open.
- Bottom “More is on the way” panel says positions, training, and the full applicant experience are paused while the next chapter is built.
- Link back to `/`.

## Interactions

Questions open/close locally. The only navigation is back to the coming-soon page.

## Data and access

All content is static. No auth or database dependency.

## Current UX implication

The FAQ accurately documents the intended product, but its closing copy says the product is paused while many routes remain implemented. It also has no direct “start a route”, “sign in”, opportunities, or training action.
