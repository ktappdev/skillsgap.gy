# I Want to Become — Product Requirements Document

**Status:** implementation plan
**Audience:** Guyanese secondary-school leavers and CSEC/CXC students without a CV
**Product loop:** aspiration → starting point → requirements → training → account handoff

## Outcome

`I Want to Become` is a public, no-account pathway explorer. A young person chooses a career direction, enters CSEC/CXC subjects and grades or photographs a result slip, and receives an honest, practical route toward that career.

It extends rather than replaces the CV-based applicant journey. CSEC/CXC results are educational signals only: they never become employment qualifications, a match score, or interview eligibility.

## First-release scope

### Included

- Public `/i-want-to-become` route and home-page entry point beside the existing CV pathway.
- Guided input for a desired career, interests, optional strengths, and CSEC/CXC subjects/grades.
- Result-slip photo capture/upload with structured subject-and-grade extraction, followed by mandatory learner review and correction.
- A role-specific result: real platform requirements, useful education-preparation signals, and verified training where available.
- A clear account-creation handoff when a learner is ready to build a verified applicant profile.
- Manual entry that is fully functional even when the image/AI service is unavailable.

### Excluded

- Public profile storage, tracking a minor, applications, employer access, interview eligibility, or CV upload.
- Saving a result-slip image in Storage, Postgres, analytics, or logs.
- Treating CSEC/CXC grades as professional certificates or employer approval.
- Automatic career choice from free text.

## Experience and continuity

The landing page has two equally clear routes:

- **I have experience** → current signup/CV pathway.
- **I want to become…** → public explorer.

The explorer uses the existing small-win language and visual system, but labels itself as career planning—not a job application.

1. **Choose a direction:** select one active curated role from a searchable list.
2. **Share a starting point:** choose interests and optionally write strengths. These are reflective context, not unverified qualifications.
3. **Add results:** manually add subject/grade pairs or photograph a CSEC/CXC result slip.
4. **Review:** the learner confirms, edits, adds, or removes every extracted subject and grade.
5. **See a starting plan:** lead with the chosen direction, show helpful CSEC/CXC preparation signals where curated, then list the actual role requirements and training routes. If no verified training exists, use the existing truthful empty state.
6. **Continue when ready:** invite account creation to build a full verified profile. Do not silently transfer public responses into employment records.

## Result-slip privacy and fallback

- Accept JPEG, PNG, and WebP; limit images to 8 MB and correct orientation in the browser.
- Preview locally and explain: “We read subjects and grades only. Review every result before continuing.”
- Process bytes only through a dedicated server path; never persist the image or raw OCR/model text.
- Return a bounded list of `{ subject, grade, confidence }`. Do not return candidate names, numbers, school, or other slip fields.
- On timeout, low confidence, malformed image, or unavailable service, preserve the selected target and show the equivalent manual fields immediately.

## Truthfulness rules

1. The learner selects the target role; grades alone never produce a job-match score.
2. Results never write to `applicant_qualifications`, `job_matches`, `candidate_consents`, `resumes`, or processing jobs.
3. Requirements and training come from existing canonical qualifications, active approved roles, and verified training programs.
4. CSEC/CXC guidance uses “helps prepare you for” and “a next step to explore,” never “you qualify” or “you are eligible.”
5. If the app has no curated preparation mapping, say so and direct learners to a guidance counsellor or provider—never invent entry prerequisites.
6. Preserve the curated-demo label until roles and training data are independently verified.

## Technical design

### Safe public pathway data

Add a narrow anonymous RPC, `public.get_public_career_pathway(target_job_role_id uuid)`, plus a safe public role-list RPC. It returns only active roles from approved companies, their safe display fields, canonical requirements, verified active training outcomes, and optional education-preparation guidance.

The RPC must not expose company-member data, applicant data, evidence, CV paths, draft roles, or inactive programs. A narrow RPC is preferable to broad anonymous read policies on operational tables.

### Preparation guidance

Add an admin-governed migration table:

```text
career_preparation_subjects
  id, job_role_id, subject_name, minimum_grade (nullable), guidance_note,
  created_at, updated_at
```

It is exposed only through the public pathway RPC. Seed only guidance the team can stand behind as preparation, not formal employer requirements.

### Image extraction

Add a browser-facing Next.js route handler and a separate Go endpoint, `POST /public/csec-result-slip`:

- Next validates file type/size and calls Thunder server-to-server with an internal shared secret. The browser never receives that secret or Thunder URL.
- Go validates the secret, type, 8 MB maximum, and short timeout; it retains image data only in memory/ephemeral scratch and cleans up before responding.
- Go uses strict structured extraction to return subject/grade pairs only; all image text is untrusted.
- No image, OCR text, prompt, response, or identifiers may be logged.
- Tests cover schema validation, rejected types/sizes, timeout, and response bounds.

The current processor documents text-only `gpt-oss-20b`, while `AGENTS.md` records a vision-capable Qwen deployment. Before enabling image analysis, verify the actual served model supports image input and update the stale documentation. This is **not** a user-flow blocker: photo parsing is progressive enhancement, and manual entry is the first-class equivalent route.

### State and handoff

Keep form progress/results in browser `sessionStorage`, not Supabase. Account creation is an explicit handoff; public responses are not copied into verified career data.

## Delivery plan

### Slice A — complete public pathway

1. Add the route, home-page entry, role picker, guided form, manual CSEC/CXC entry, review screen, results UI, and session state.
2. Add safe role/pathway RPCs, preparation-guidance migration, and seed data.
3. Add unit tests for grade validation, result shaping, role visibility, and missing-guidance/training states.

### Slice B — photo route with equal user value

1. Add capture/preview and editable parsed-results UI.
2. Add Next proxy and Go endpoint with strict validation, ephemeral cleanup, and test coverage.
3. Gate photo parsing on a verified vision-capable model; when unavailable, offer manual entry without losing progress.
4. Test with one non-sensitive fixture plus malformed-image, low-confidence, and timeout flows.

Both inputs belong in the first release. Slice A is built first so infrastructure configuration can never block a learner from receiving a pathway.

## Acceptance criteria

- An anonymous visitor selects an active role, manually enters CSEC/CXC results, and receives a role-specific pathway without an account.
- A visitor uploads/takes a valid result-slip photo, corrects extracted values, and gets the same pathway.
- If image processing fails, the visitor completes the manual route without losing their chosen role or entries.
- No public action creates a profile, CV, applicant qualification, match, consent, processing job, Storage object, or exposed secret.
- Only active approved roles and verified training appear.
- Existing CV, applicant dashboard, company, admin, auth, and demo flows retain current behavior.
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, Go tests/vet/build, and relevant Supabase checks pass.

## Definition of done

A school leaver without a CV can anonymously turn either manually entered or photo-read CSEC/CXC results and a selected aspiration into a clear, honest, role-specific plan, without weakening the existing privacy model or depending on AI availability.
