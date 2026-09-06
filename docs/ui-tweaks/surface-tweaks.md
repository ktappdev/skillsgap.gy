# Surface tweaks, page by page

Ordered roughly by traffic / first impression. Concrete diffs I'd ship.

---

## 1. `/` (home) — the biggest offender

### What it does now
Perfectly symmetric landing pattern: kicker → h1 → lede → 3 CTAs → canned "65% match" card on the right → 01/02/03 grid → footer.

### What a human version does

**a. Drop the "65% match" example card.** It's a fake widget that screams template. Replace with a real local disclosure: e.g. a horizontal scroll of three real job titles in market with a single line each naming the closest stepping stone (no UI chrome, just type):

```
Mechanical maintenance → Hydraulics at GTI
CSEC passes → Field technician trainee
Oil rig experience → BOSIET certification
```

**b. Fix the three-step grid.** Rename to verbs and kill the numbers:
- "01 Your experience" → "Tell us what you've done"
- "02 Your closest routes" → "See the roles that already fit"
- "03 A practical next step" → "Grab the next piece of training"

**c. CTA copy.** "I have experience / I want to become… / I represent a company" is fine but it's three parallel CTAs, which signals template. Pick one. I'd keep "See your routes" as the primary, deemphasize the other two as text links below.

**d. Replace the SG badge.** A green square with white "SG" letters is generic. Either use a real SVG monogram or just `skillsgap.gy` as plain text with the `.gy` in the accent colour. The badge is doing nothing for trust.

**e. Font.** Geist is the AI-tell font. Switching to Inter, Söhne, or even system-ui shifts the whole register. Cheap and high-leverage. If sticking with a Google font, **Inter Tight** for headings + **Inter** for body is the easiest "shipped product" feel.

**f. Background.** `--background: #f3f7f5` is soft-teal grey, which combined with the white cards gives that marshy AI-default feel. Try `#fafaf9` (stone-50) and let surface be `#ffffff`. The contrast with `--accent` becomes sharper.

---

## 2. `/i-want-to-become` — hedging central

### What it does now
- 4 separate safety disclaimers
- Three numbered fieldsets in one card
- A "your result slip was not saved" micro-warning
- "No verified local program is listed yet. This does not mean the qualification is unavailable." (the most AI sentence in the codebase)

### What a human version does

**a. Merge fieldsets 1 and 2.** "What do you want to become?" and "What interests you?" are the same question worded twice. Single select with optional inline hint underneath: "Tell us one thing you like about the work — it shows up in your plan."

**b. Replace the photo-slip copy.** The whole 4-line "We could not read that image automatically. Your photo was not saved—please enter the subjects and grades below to continue." becomes:

> Couldn't read that one. Type the grades in below — it works the same.

One sentence. Same information.

**c. Occupation plan panel header.** Currently: *"A route toward [role]"* + 3-paragraph disclaimer. Make the disclaimer a single muted line under the h1, instead of two full disclaimers above and below the fold.

**d. Subject list badges.** "listed by you" / "worth exploring" → keep the check / arrow visual but drop the words entirely. The visual is enough.

**e. The `01 02 03` numbered cards inside plans.** Replace with simple bullet dividers in a `<ol>` without the circled numbers. The AI-tell is *the ring itself*, not the order.

---

## 3. `/login` and `/signup`

### What it does now
- Kicker "Join the build" / "Welcome back"
- h1 "Start your pathway" / "Return to your pathway"
- Lede: "Create an applicant account and start with the experience you already have."
- OAuth + demo login + form on a `rounded-3xl` card
- Tagline below: "A clearer route from experience to opportunity."

### What a human version does

**a. Kill the pathway-speak.** "Start your pathway" → **"Sign in."** or **"Create an account."** Real products name the action. The "pathway" poetry belongs on the marketing surface only — and even there it's earned only when the user says it first.

**b. Kill the closing tagline.** "A clearer route from experience to opportunity." is a sentence pasted onto a form for no reason.

**c. Card radius.** `rounded-3xl` on auth cards plus `rounded-xl` inputs reads as "Vercel template." Pick one radius scale (probably `rounded-lg` for cards, `rounded-md` for inputs) and stick to it across the app.

**d. Demo buttons.** Make sure they're clearly demarcated as demo — currently they blend in with the OAuth section. A divider with "Want to look around first?" is more human.

---

## 4. `/dashboard`

### What it does now
- Header: kicker + h1 "Good to see you, {name}." + lede
- Right rail: "Small wins matter" + "Your progress, made clear"
- Below: "Already completed training?" card

### What a human version does

**a. Greeting.** "Good to see you, Ken." is fine. But the lede ("We start with what you can already do…") is duplicated information — the user's progress is right there. Cut it. The greeting alone is enough.

**b. "Small wins matter."** This is AI banner-grade. The actual content beneath (the milestone path) is good. Just delete the kicker line.

**c. "Your progress, made clear."** Yoda-inversion. → **"Where you are."**

**d. "Already completed training?"** Good prompt, but the panel is `bg-surface-muted` and low-contrast so it looks forgotten. Bump to a real bordered card so the user notices.

**e. Empty state.** `CvUpload` says "We will identify skills, certifications, and experience." → "We'll read it and pull out what counts." One clause. Present tense.

---

## 5. `/company` and `/company/request-access`

### What it does now
- "Company workspace" kicker, "Find prepared local talent."
- Three `Metric` boxes in a row, all `<section>`s
- Privacy copy given equal visual weight as the CTA card

### What a human version does

**a. "Find prepared local talent."** → **"See who's ready."** Sharper, less corporate.

**b. Privacy panel.** Move it below the metrics. Right now it shares top billing with the actual CTA, which is symmetric-hedging. The user goal here is "view candidates" — put privacy in the footer of the candidate card or as a one-liner in the candidate list header.

**c. Request-access form.** Drop the `rounded-3xl` here too. The button is square-shouldered (`min-h-11 w-full bg-accent`) — fine, but add a small footer note with a real anchor: "Once approved, you can post roles and see anonymized matches." One concrete next-step sentence instead of three paragraphs.

---

## 6. Cross-cutting tokens

### Colour
- `--accent: #0f766e` (teal-700) is the AI default. Suggest shifting to a slightly deeper green: `#0b5f4c` or a darker `#134e4a`. Still in brand-adjacent territory, but breaks the Vercel-template look.
- `--background: #f3f7f5` → `#fafaf9` (stone-50) — kills the "pastel wash" feel.
- Keep `--danger` as is.

### Radius
Standardize to two sizes:
- Cards / sections: `rounded-lg` (8px)
- Inputs / buttons: `rounded-md` (6px)

Currently mixed: `rounded-xl` (12px) on inputs, `rounded-3xl` (24px) on auth card, `rounded-xl` on dashboard cards. That inconsistency is fine on its own but the *rounded-3xl* is an AI-template calling card.

### Typography
- Drop Geist. Use system stack first: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`. Saves a font fetch and instantly reads "shipped app." If you want a custom face, use Inter.
- Loosen the `tracking-[-0.04em]` / `tracking-[-0.05em]` to `tracking-[-0.02em]`. Extreme negative tracking on body-sized text is an AI-template habit.
- The `tracking-[0.18em]` uppercase kicker everywhere: keep it on the hero only. Everywhere else, drop it.

### Borders and shadows
- `shadow-sm` on every card is symbolic. Either *remove* all shadows (rely on border alone — flatter, more contemporary) or use a *real* shadow like `shadow-md` sparingly on sticky headers. The current half-shadow reads indecisive.
- Consider removing the border on `bg-surface-muted` panels — let the tone difference do the work.

### Spacing
- `mt-3 / mt-6 / mt-8 / mt-10` varies randomly across surfaces. Pick three rhythm stops (e.g. 12, 24, 48px) and reuse them. Consistent spacing rhythm is the single biggest "human made this" signal you can buy cheap.

---

## Priority order if time is tight

1. **Drop the kickers** on every surface except `/` hero (10 minutes, big win)
2. **Rename the 3-step grid** on `/` to actual verbs
3. **Delete the closing tagline** under the auth card
4. **Tighten `/i-want-to-become`'s disclaimers** — three paragraphs of hedging → one
5. **Swap the font** off Geist
6. **Standardize border radius** to two sizes

Individually small; together they take off the AI smell.
