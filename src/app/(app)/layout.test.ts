import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * A cold load of any `(app)` route only paints that segment's `loading.tsx` if
 * the group layout renders without waiting on runtime data. An `async` layout
 * here blocks the whole group and suppresses every `(app)` fallback — the header
 * included — which is why the session read is suspended in `<AppHeader />`
 * instead. See Next's `layout.md`, "Layouts and loading.js".
 *
 * These assertions are structural because the layout is a Server Component that
 * reads the session through `getAppShell()` in `<AppHeader />`; it cannot be
 * rendered by the jsdom test environment.
 */

const layoutPath = "src/app/(app)/layout.tsx";
const source = readFileSync(join(process.cwd(), layoutPath), "utf8");

/** Everything between two markers, so each assertion reads one region. */
function region(start: string, end: string) {
  const from = source.indexOf(start);
  const to = source.indexOf(end);
  expect(from, `${start} not found in ${layoutPath}`).toBeGreaterThan(-1);
  expect(to, `${end} not found in ${layoutPath}`).toBeGreaterThan(from);
  return source.slice(from, to);
}

describe("(app) app shell streaming", () => {
  it("keeps the shell synchronous so segment fallbacks can paint", () => {
    expect(source).not.toMatch(/export default async function/);
    expect(source).toMatch(/export default function AppLayout\(/);
  });

  it("suspends the session read behind its own boundary", () => {
    expect(source).toMatch(
      /<Suspense fallback=\{<AppHeaderSkeleton \/>\}>\s*<AppHeader \/>\s*<\/Suspense>/,
    );
  });

  it("awaits nothing in the layout body", () => {
    const body = region("export default function AppLayout(", "async function AppHeader(");
    expect(body).not.toMatch(/\bawait\b/);
  });

  it("awaits the session read inside AppHeader", () => {
    const header = region("async function AppHeader(", "async function getAppShell(");
    expect(header).toMatch(/await getAppShell\(\)/);
  });

  it("preserves the main landmark, both navigation rows, and the sign-out form", () => {
    expect(source).toMatch(/<main id="main-content">\{children\}<\/main>/);
    expect(source).toMatch(/<AppNavigation items=\{navigation\} \/>/);
    expect(source).toMatch(/<AppNavigation items=\{navigation\} mobile \/>/);
    expect(source).toMatch(/<form action=\{signOut\}>/);
    expect(source).toMatch(/pendingLabel="Signing out…"/);
  });

  it("preserves the anonymous header fallback", () => {
    expect(source).toMatch(/return \{ home: "\/login", navigation: \[\] as const \};/);
  });
});
