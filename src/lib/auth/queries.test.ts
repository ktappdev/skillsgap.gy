import { describe, expect, it, vi } from "vitest";

import {
  requireApplicant,
  requireApprovedCompanyMember,
  requirePlatformAdmin,
  requireUser,
} from "@/lib/auth/queries";
import { getSafeRedirectPath } from "@/lib/validation";

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
    },
  }),
}));

/** Runs a guard that must redirect and returns the redirect target. */
async function redirectTarget(run: () => Promise<unknown>) {
  try {
    await run();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("NEXT_REDIRECT:")) return message.slice("NEXT_REDIRECT:".length);
    throw error;
  }
  throw new Error("Expected the guard to redirect, but it returned.");
}

/** The destination a guard hands to /login, read back the way /login reads it. */
function destinationOf(target: string) {
  return new URL(target, "https://skillsgap.gy").searchParams.get("next");
}

describe("unauthenticated guards send the visitor to login with a destination", () => {
  it.each([
    ["requireUser", "/admin", () => requireUser("/admin")],
    ["requireApplicant", "/interviews", () => requireApplicant("/interviews")],
    ["requirePlatformAdmin", "/admin/companies", () => requirePlatformAdmin("/admin/companies")],
    ["requireApprovedCompanyMember", "/company/jobs", () => requireApprovedCompanyMember("/company/jobs")],
  ] as const)("%s redirects to /login carrying %s", async (_name, expected, run) => {
    const target = await redirectTarget(run);
    expect(target).toBe(`/login?next=${encodeURIComponent(expected)}`);
    expect(destinationOf(target)).toBe(expected);
  });

  it("encodes the destination so it survives the query string intact", async () => {
    const target = await redirectTarget(() => requireApplicant("/matches/abc-123"));
    expect(target).toBe("/login?next=%2Fmatches%2Fabc-123");
    expect(destinationOf(target)).toBe("/matches/abc-123");
  });

  it("defaults requireUser to the applicant home", async () => {
    expect(await redirectTarget(() => requireUser())).toBe("/login?next=%2Fdashboard");
  });
});

describe("the login destination cannot be turned into an open redirect", () => {
  it("keeps a guard destination on this origin", async () => {
    const target = await redirectTarget(() => requireUser("/admin"));
    const safe = getSafeRedirectPath(destinationOf(target), "/dashboard");
    expect(safe).toBe("/admin");
    expect(new URL(safe, "https://skillsgap.gy").origin).toBe("https://skillsgap.gy");
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "https://evil.example/dashboard",
  ])("drops the hostile destination %s instead of following it off-origin", async (hostile) => {
    // /login reads `next` from the query string, so the value must not be able to
    // escape this origin even when the redirect that produced it did not come
    // from a page guard.
    const target = await redirectTarget(() => requireUser(hostile));
    const safe = getSafeRedirectPath(destinationOf(target), "/dashboard");
    expect(safe).toBe("/dashboard");
    expect(new URL(safe, "https://skillsgap.gy").origin).toBe("https://skillsgap.gy");
  });
});
