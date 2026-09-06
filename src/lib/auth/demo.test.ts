import { afterEach, describe, expect, it } from "vitest";

import { DEMO_REDIRECTS, getDemoCredentials, isDemoApplicantMetadata, parseDemoRole } from "@/lib/auth/demo";
import { getDemoMatch, shouldUseDemoMatches } from "@/lib/skillsgap-demo";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("parseDemoRole", () => {
  it("accepts the four supported roles", () => {
    expect(parseDemoRole("applicant")).toBe("applicant");
    expect(parseDemoRole("owner")).toBe("owner");
    expect(parseDemoRole("recruiter")).toBe("recruiter");
    expect(parseDemoRole("admin")).toBe("admin");
  });

  it("rejects unknown and empty values", () => {
    expect(parseDemoRole("superuser")).toBeNull();
    expect(parseDemoRole("")).toBeNull();
    expect(parseDemoRole(null)).toBeNull();
    expect(parseDemoRole(undefined)).toBeNull();
  });
});

describe("getDemoCredentials", () => {
  it("returns email and password when both are configured", () => {
    process.env.DEMO_APPLICANT_EMAIL = "applicant@demo.gy";
    process.env.DEMO_APPLICANT_PASSWORD = "demo-pass-1";

    expect(getDemoCredentials("applicant")).toEqual({
      email: "applicant@demo.gy",
      password: "demo-pass-1",
    });
  });

  it("trims the email but keeps the password verbatim", () => {
    process.env.DEMO_OWNER_EMAIL = "  owner@demo.gy  ";
    process.env.DEMO_OWNER_PASSWORD = "  spaced-pass  ";

    expect(getDemoCredentials("owner")).toEqual({
      email: "owner@demo.gy",
      password: "  spaced-pass  ",
    });
  });

  it("returns null when the email is missing", () => {
    process.env.DEMO_RECRUITER_PASSWORD = "demo-pass-3";
    delete process.env.DEMO_RECRUITER_EMAIL;

    expect(getDemoCredentials("recruiter")).toBeNull();
  });

  it("returns null when the password is missing", () => {
    process.env.DEMO_ADMIN_EMAIL = "admin@demo.gy";
    delete process.env.DEMO_ADMIN_PASSWORD;

    expect(getDemoCredentials("admin")).toBeNull();
  });
});

describe("DEMO_REDIRECTS", () => {
  it("routes each role to its own home page", () => {
    expect(DEMO_REDIRECTS.applicant).toBe("/dashboard");
    expect(DEMO_REDIRECTS.owner).toBe("/company");
    expect(DEMO_REDIRECTS.recruiter).toBe("/company");
    expect(DEMO_REDIRECTS.admin).toBe("/admin");
  });
});

describe("demo applicant fallback", () => {
  it("recognizes only the provisioned demo applicant", () => {
    expect(isDemoApplicantMetadata({ demo: true, role: "applicant" })).toBe(true);
    expect(isDemoApplicantMetadata({ demo: true, role: "owner" })).toBe(false);
    expect(isDemoApplicantMetadata({ full_name: "New applicant" })).toBe(false);
    expect(isDemoApplicantMetadata(null)).toBe(false);
  });

  it("does not show demo matches to a brand-new regular account", () => {
    expect(shouldUseDemoMatches({ isDemoApplicant: false, matchCount: 0, hasResume: false })).toBe(false);
  });

  it("keeps the fallback available for the prepared demo applicant only", () => {
    expect(shouldUseDemoMatches({ isDemoApplicant: true, matchCount: 0, hasResume: false })).toBe(true);
    expect(shouldUseDemoMatches({ isDemoApplicant: true, matchCount: 1, hasResume: false })).toBe(false);
    expect(shouldUseDemoMatches({ isDemoApplicant: true, matchCount: 0, hasResume: true })).toBe(false);
  });

  it("does not expose a demo route to a regular applicant", () => {
    expect(getDemoMatch("offshore-mechanical-technician", false)).toBeNull();
    expect(getDemoMatch("offshore-mechanical-technician", true)?.isDemo).toBe(true);
  });
});
