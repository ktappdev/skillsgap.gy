import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The `(app)` boundary guard for the whole route group.
 *
 * `src/app/(app)/layout.tsx` intentionally does not redirect. A Next.js layout
 * cannot read the current URL — see `use-pathname.md:36`, "Reading the current
 * URL from a Server Component is not supported" — so a layout-level redirect
 * cannot know the destination. Worse, a layout renders before the page it
 * wraps, so redirecting there would pre-empt every page guard and collapse
 * every deep link back to a single fallback, which is exactly the defect this
 * boundary exists to prevent.
 *
 * Next.js instead recommends checking as close to the data as possible
 * (`authentication.md:1121`) and warns that checks in layouts do not re-run on
 * navigation (`authentication.md:1352`, "Layouts and auth checks").
 *
 * That makes the per-page guard load-bearing, so this test is the boundary: an
 * `(app)` page cannot be added without a guard, and a guard call cannot be
 * added without the destination it must return the user to.
 */

const appGroupDir = join(process.cwd(), "src/app/(app)");

/** Role/account-scoped guards, plus the raw session guard. */
const guardCallPattern =
  /require(Applicant|PlatformAdmin|ApprovedCompanyMember|ApprovedCompanyOwner|TrainingProvider|User)\(/;

/**
 * The same call must pass a root-relative destination literal as its first
 * argument, e.g. "/interviews" or `/matches/${matchId}`. Requiring the leading
 * slash also keeps the destination on this origin by construction.
 */
const guardCallWithDestinationPattern =
  /require(Applicant|PlatformAdmin|ApprovedCompanyMember|ApprovedCompanyOwner|TrainingProvider|User)\(\s*["`]\//;

function findPages(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return findPages(path);
    return entry.name === "page.tsx" ? [path] : [];
  });
}

const pages = findPages(appGroupDir)
  .map((page) => relative(process.cwd(), page))
  .sort();

describe("(app) route group guards", () => {
  it("finds the route group's pages", () => {
    // Guards against the walker silently finding nothing and passing vacuously.
    expect(pages).toContain("src/app/(app)/dashboard/page.tsx");
    expect(pages.length).toBeGreaterThanOrEqual(16);
  });

  it.each(pages)("%s is guarded", (page) => {
    const source = readFileSync(join(process.cwd(), page), "utf8");
    expect(
      guardCallPattern.test(source),
      `${page} does not call an auth guard. Every page under src/app/(app) must call ` +
        "requireApplicant, requirePlatformAdmin, requireApprovedCompanyMember, " +
        "requireApprovedCompanyOwner, requireTrainingProvider or requireUser, because the " +
        "(app) layout cannot redirect without discarding the destination.",
    ).toBe(true);
  });

  it.each(pages)("%s passes its own destination to the guard", (page) => {
    const source = readFileSync(join(process.cwd(), page), "utf8");
    expect(
      guardCallWithDestinationPattern.test(source),
      `${page} calls its guard without a root-relative destination literal, so an anonymous ` +
        "visitor is sent to /login with no way back to this page. Pass the page path, e.g. " +
        'requireApplicant("/interviews").',
    ).toBe(true);
  });
});
