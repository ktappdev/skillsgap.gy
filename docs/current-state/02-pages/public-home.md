# `/` — public home

Sources: `src/app/page.tsx`, `src/components/home/home-hero.tsx`, `src/components/shareable/public-content-header.tsx`.

## Purpose

A static public entry point into the skills → opportunities → gaps → training loop. Visitors can match existing experience or explore a career direction without a CV.

## Visible structure

- Full-width offshore hero with an overlaid navigation, white headline, and links to signup and the career explorer.
- Navigation retains Positions, Training, Build a route, FAQ, Sign in, and Get started. Its overlay appearance is opt-in; other public pages retain their existing header appearance.
- Three short steps explain profile confirmation, role matching, and training for missing qualifications.
- Two starting points support experienced workers and people exploring a career.
- An image-backed call to action links to public positions and training before signup.
- Shared public footer.

## Image and accessibility

`public/images/offshore-hero.webp` is an approximately 100 KB WebP derived from the user-approved image generated with the built-in image-generation tool. `public/images/offshore-overhead.webp` is an approximately 170 KB WebP generated from that same scene as a straight-down view for the closing call to action. Both depict a fictional offshore platform, not an identified facility or employer. The hero labels the image as an AI-generated illustration; the source prompts requested no text or branding.

Next.js serves responsive image sizes and preloads the hero. Both decorative images have empty alt attributes, with dark overlays for readable text. Navigation wraps on narrow screens; content can expand vertically without a fixed height. White keyboard focus outlines remain visible over the image. No animation or carousel is used.

## Data and access

No database, auth, or server action dependency. The page renders for everyone and is statically generated. Primary CTAs lead to applicant signup or the no-CV career explorer.

## Current UX implication

The energy imagery establishes the corporate visual direction; the copy keeps the service focused on careers and skills. Catalogue freshness still depends on the connected position and training data.
