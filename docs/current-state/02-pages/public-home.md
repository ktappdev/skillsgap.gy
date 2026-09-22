# `/` — public home

Sources: `src/app/page.tsx`, `src/components/home/home-hero.tsx`, `src/components/shareable/public-content-header.tsx`.

## Purpose

A static public entry point into the skills → opportunities → gaps → training loop. Visitors can match existing experience or explore a career direction without a CV.

## Visible structure

- Full-width image hero with an overlaid navigation, white headline, and links to signup and the career explorer. The backdrop slowly crossfades between offshore, broader electrical-energy infrastructure, and energy operations office scenes; it remains on the first frame for reduced-motion users.
- Navigation retains Positions, Training, Build a route, FAQ, Sign in, and Get started. On small screens these links move into an accessible menu button; its overlay appearance is opt-in, and other public pages retain their existing header appearance.
- Three short steps explain role selection, skill confirmation, and training for missing qualifications.
- Two starting points support experienced workers and people exploring a career.
- An image-backed call to action links to public positions and training before signup.
- Shared public footer.

## Image and accessibility

`public/images/offshore-hero.webp` is an approximately 100 KB WebP derived from the user-approved image generated with the built-in image-generation tool. `public/images/energy-hero.webp` is an approximately 173 KB WebP generated from that scene’s visual language as a clearly electrical-energy scene with a substation, transmission pylons, solar panels, and wind turbines. `public/images/energy-office-hero.webp` is an approximately 163 KB WebP generated in the same blue-hour palette, showing an energy operations office with people working at desks and electrical infrastructure outside. `public/images/offshore-overhead.webp` is an approximately 170 KB WebP generated from the original scene as a straight-down view for the closing call to action. All depict fictional energy infrastructure, not an identified facility or employer. The hero labels the image as an AI-generated illustration; the source prompts requested no text or branding.

Next.js serves responsive image sizes and preloads the first hero frame. The three decorative images have empty alt attributes, with dark overlays for readable text. The hero uses a slow opacity crossfade rather than horizontal sliding; reduced-motion users remain on the first frame. Navigation wraps on narrow screens; content can expand vertically without a fixed height. White keyboard focus outlines remain visible over the image.

## Data and access

No database, auth, or server action dependency. The page renders for everyone and is statically generated. Primary CTAs lead to applicant signup or the no-CV career explorer.

## Current UX implication

The energy imagery establishes the corporate visual direction; the copy explains how the service helps people in Guyana build skills for oil, gas, and energy work. Catalogue freshness still depends on the connected position and training data.
