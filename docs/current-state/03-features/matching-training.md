# Matching and training feature

Sources: `src/lib/skillsgap/queries.ts`, `src/lib/skillsgap/actions.ts`, `src/components/skillsgap/match-card.tsx`, `src/components/skillsgap/gap-action-list.tsx`

## Matching rules

- Roles must be active and their companies approved.
- Requirements carry a qualification, kind, weight, optional minimum years, and mandatory flag.
- Applicant qualifications must be confirmed.
- PostgreSQL calculates the score from satisfied requirement weight and separately enforces mandatory requirements.
- Interview eligibility requires the role threshold plus all mandatory requirements.
- The applicant query filters current matches and returns only the top three.

## Match presentation

Cards show role/company, score, progress bar, eligibility/remaining points, up to two strengths, gap count, an `Open pathway` link, and a public share link. The detail page expands this into an eligibility panel, strengths, and prioritized gaps.

## Gaps

Gaps are sorted with mandatory requirements first. The first gap is labeled `Start here`; additional gaps are behind a disclosure. For a mapped verified training outcome, the user can view a course, share it, open the external enrollment/current-intake link, and mark the gap’s plan state as started. If no route exists, the page tells the user to ask the employer/provider what evidence they accept.

## Public training catalogue

Public training includes only active programs whose provider is verified. A program’s visible “skills it builds” are active qualification outcomes. The same provider/outcome wiring powers a match gap’s recommended training.

## Current risks

- Top-three filtering can make a correctly wired role look absent; the codebase has readiness scripts/docs but the UI does not explain ranking limits.
- A training outcome is a qualification mapping, not proof that a course is currently accepting learners. Pages include a freshness warning and external confirmation instruction.
- The match detail combines decision, learning, sharing, and applying actions in one page; this is a likely candidate for clearer sequencing.
