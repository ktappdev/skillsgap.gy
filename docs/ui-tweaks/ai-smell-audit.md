# AI-smell audit

What reads as machine-generated on `/`, `/i-want-to-become`, `/login`, `/signup`, `/dashboard`, and neighbours — and why.

## What the human eye picks up first

The design is not bad. It's *over-corrected*. The smell comes from polish patterns that AI produces by default and humans stop noticing:

### 1. Too-safe symmetric rhythm

Every section uses the same recipe:
- tiny uppercase teal kicker
- large tight-tracked headline
- gray muted lede
- buttons below

It appears on:
- `/` hero (`/src/app/page.tsx:14-36`)
- `/i-want-to-become` hero (`/src/app/i-want-to-become/page.tsx`)
- `/login` / `/signup` (`/src/components/auth/auth-form.tsx:34-44`)
- `/dashboard` header (`/src/app/(app)/dashboard/page.tsx:33-39`)
- every "Your starting plan" / "Your starting point" / "A practical starting point" card in `career-explorer.tsx`
- `/company` and `/company/request-access`

Six surfaces — same cadence. A human writer varies sentence shape; a machine keeps cadence because it's "safe."

### 2. Over-eager microcopy everywhere

Almost every UI element carries a *cushioning* line:
- "This is a career-planning guide, not a job application."
- "We have not saved this plan or your result slip."
- "Your entries stay in this browser until you choose to create an account."
- "It is not a live vacancy, a job-match score, or a promise of employment."
- "This does not mean the qualification is unavailable."

AI hedges by default. Real products pick one reassurance per flow and live with it. Three hedges on the same panel makes the user feel they're being talked at by a lawyer-bot.

### 3. Hollow motivational verbs

- "Build the requirements one at a time"
- "Build toward the work, one step at a time"
- "Build the foundations"
- "Start where you want to go"
- "We start with what you can already do, then focus only on the steps that move you closer"
- "Build the next thing"

These are template-grade. They say *nothing concrete*. A real product names what the user is doing.

### 4. Card-heavy, border-everything

Every surface is wrapped in `border border-border bg-surface p-5 shadow-sm`:
- the `65% match` card on the home hero — a card inside a hero, both on the same off-white background
- `CvUpload`, `MilestonePath`, every `CareerExplorer` section
- every `Metric`, every article in `/company`

Humans group. Carding every discrete thought flattens hierarchy and reads as "components were glued together."

### 5. Status pills with title-case corporate tone

- `"Requires attention"` → `text-danger`
- `"Interview unlocked"`
- `"Processing queued"`
- `"A useful foundation"`

These are statuses as PowerPoint labels. They tell the user *the system is talking to them* rather than *the site is talking to them*.

### 6. The desk-y "65% match" hero

Looks slick but feels canned: a real product would not open with a fictional example wrapped in a generic stat chip. It's the landing-page equivalent of stock photography.

### 7. Tailwind default teal IOU

Accent is Tailwind `teal-700` (`#0f766e`). Everyone's AI-polished site uses this exact teal. The Guyanese-flag identity we're pretending to have is green-gold-black; leaning teal is the easiest tell.

### 8. Font: Geist

Geist is the Vercel default. Every fresh Next app has it. It's fine — but it *is* the smell.

### 9. Numbered decision moments masquerading as "01 / 02 / 03" steps

`/src/app/page.tsx:5-9` "01 Your experience / 02 Your closest routes / 03 A practical next step" — the three-step rhythm is *the* AI landing page tell. It signals "template." Real copy talks like a person.

### 10. Over-reassurance about privacy

- "Your CV stays private."
- "Candidates remain anonymous until they consent."
- "Identity stays with the applicant."
- "We have not saved this plan."

All true. But said three times per surface, it stops being reassurance and starts being a tell that the copywriter didn't trust the product.

---

## Tally: smells per surface

| Surface | Symmetric recipe | Hedge lines | Hollow verbs | Carded | "SG" badge |
|---|---|---|---|---|---|
| `/` | ✓×3 | ✓ | ✓ | ✓ | ✓ |
| `/i-want-to-become` | ✓ | ✓×4 | ✓×4 | ✓×5 | ✓ |
| `/login` `/signup` | ✓ | — | ✓ | ✓×2 | ✓ |
| `/dashboard` | ✓ | ✓×3 | ✓×4 | ✓×4 | — |
| `/company` | ✓ | ✓ | ✓ | ✓×5 | — |
| `/company/request-access` | ✓ | ✓ | ✓ | ✓ | ✓ |

The pattern is the same everywhere. That consistency is the smell.
