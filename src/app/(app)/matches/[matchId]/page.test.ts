import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The match detail page is where a candidate reads why a role is out of reach,
 * so its readiness copy is load-bearing: it must never read as "you are ready"
 * while a mandatory requirement is unmet.
 *
 * `match.eligible` is INTERVIEW eligibility — `mandatory_ok AND score >=
 * threshold` (`supabase/migrations/20260905022659:477`) — which is deliberately
 * stricter than the score-only gate the Apply button uses. The two were tangled
 * once already by that naming collision, so both behaviours are pinned below.
 *
 * These assertions are structural because the page is an async Server Component
 * that awaits `requireApplicant`; jsdom cannot render it.
 */

const pagePath = "src/app/(app)/matches/[matchId]/page.tsx";
const opportunitiesPath = "src/app/opportunities/[roleId]/page.tsx";
const source = readFileSync(join(process.cwd(), pagePath), "utf8");

/** Shared copy, so the two requirements lists cannot drift apart. */
const legend =
  "Required items must be met for interview eligibility. Preferred items strengthen your match and can guide your next step.";
const allRequirementsMet = "You meet every published requirement for this role.";

/** Everything between two markers, so each assertion reads one branch. */
function region(start: string, end: string) {
  const from = source.indexOf(start);
  const to = source.indexOf(end);
  expect(from, `${start} not found in ${pagePath}`).toBeGreaterThan(-1);
  expect(to, `${end} not found in ${pagePath}`).toBeGreaterThan(from);
  return source.slice(from, to);
}

const noGapsEligible = region(
  "if (match.gaps.length === 0 && match.eligible) {",
  "if (match.gaps.length === 0) {",
);
const noGapsIneligible = region("if (match.gaps.length === 0) {", "<GapActionList");
const gapsBranch = region('aria-labelledby="gaps-heading"', "<GapActionList");

describe("match detail readiness copy", () => {
  it("never renders a score ratio as readiness", () => {
    expect(source).not.toMatch(/% there/);
    expect(source).not.toMatch(/eligibilityProgress/);
  });

  it("reports the score against the threshold instead of a bare percentage", () => {
    expect(source).toMatch(
      /Score \{match\.score\}% against the \{match\.threshold\}% interview threshold\./,
    );
  });

  it("separates score met from interview eligibility", () => {
    // Mirrors src/components/dashboard/applicant-overview.tsx:215 so the two
    // surfaces cannot disagree about the same match.
    expect(source).toContain("Score and mandatory requirements met.");
    expect(source).toContain("Score met; review mandatory requirements.");
    expect(source).toMatch(/\} to the interview threshold\./);
  });

  it("names the unmet required items when the mandatory gate is closed", () => {
    expect(source).toMatch(/unmetMandatoryCount = match\.gaps\.filter\(\(gap\) => gap\.mandatory\)\.length/);
    expect(source).toContain("still unmet.");
  });

  it("claims every requirement is met only in the eligible branch", () => {
    expect(source.match(/meet every published requirement/g)).toHaveLength(1);
    expect(noGapsEligible).toContain(allRequirementsMet);
    expect(noGapsIneligible).not.toContain(allRequirementsMet);
  });
});

describe("match detail requirements section", () => {
  it("announces the no-gaps eligible state with a route to interviews", () => {
    expect(noGapsEligible).toContain('role="status"');
    expect(noGapsEligible).toContain('href="/interviews"');
  });

  it("keeps a status panel, without the interview link, when no gaps exist but the score is short", () => {
    expect(noGapsIneligible).toContain('role="status"');
    expect(noGapsIneligible).not.toContain('href="/interviews"');
    expect(noGapsIneligible).toContain("below the {match.threshold}% interview threshold");
  });

  it("never renders a heading of 0 requirements over an empty list", () => {
    // Both zero-gap cases return before the gap list, whose own empty case
    // returns null (gap-action-list.tsx:55).
    expect(noGapsEligible).not.toContain("<GapActionList");
    expect(noGapsIneligible).not.toContain("<GapActionList");
    expect(gapsBranch).toContain('{match.gaps.length} {match.gaps.length === 1 ? "requirement" : "requirements"} left');
    expect(source).toContain("<GapActionList gaps={match.gaps} isDemo={match.isDemo} />");
  });

  it("shows the shared required/preferred legend beside the gap list", () => {
    expect(gapsBranch).toContain(legend);
  });

  it("matches the opportunities page legend word for word", () => {
    const opportunities = readFileSync(join(process.cwd(), opportunitiesPath), "utf8").replace(/\s+/g, " ");
    expect(opportunities).toContain(legend);
    expect(source).toContain(legend);
  });
});

describe("match detail apply gate", () => {
  it("keeps ApplyButton on the score-only gate", () => {
    // Apply-ability is score-only by design: the server gate
    // (src/lib/skillsgap/actions.ts:207) and the RLS policy in
    // supabase/migrations/20260906040000_default_eligibility_threshold.sql
    // require only score >= threshold. `match.eligible` is a different, stricter
    // rule and must not be passed here.
    expect(source).toContain("eligible={match.score >= match.threshold}");
    expect(source).not.toContain("eligible={match.eligible}");
  });
});
