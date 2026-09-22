import { describe, expect, it } from "vitest";

import { getSafeAuthCallbackPath, getSafeRedirectPath, isJsonValue, parseJsonValue } from "@/lib/validation";

describe("getSafeRedirectPath", () => {
  it("keeps an internal path", () => {
    expect(getSafeRedirectPath("/dashboard?tab=items")).toBe("/dashboard?tab=items");
  });

  it("falls back for external or protocol-relative paths", () => {
    expect(getSafeRedirectPath("https://example.com")).toBe("/dashboard");
    expect(getSafeRedirectPath("//example.com")).toBe("/dashboard");
    expect(getSafeRedirectPath("/\\\\example.com")).toBe("/dashboard");
  });

  it.each([
    "/\\example.com", "/%2f%2fexample.com", "/company/../login", "/company/./team",
    "/company\n/team", "/company/team?next=/login", "/login?redirect_to=https://example.com",
    "/login?%6eext=/company", "/company invitations/token",
  ])("rejects malformed or nested redirects: %s", (value) => {
    expect(getSafeRedirectPath(value, "")).toBe("");
  });

  it.each([
    "/company/request-access?submitted=1",
    "/company/team?tab=jobs",
    "/dashboard?roleId=abc123&from=opportunities",
  ])("preserves a benign querystring path: %s", (value) => {
    expect(getSafeRedirectPath(value, "")).toBe(value);
  });

  it.each([
    "/auth/callback?code=attacker-code",
    "/auth/callback?token_hash=abc&type=email",
    "/login?state=xyz&error_description=oops",
  ])("rejects auth-callback params in a redirect target: %s", (value) => {
    expect(getSafeRedirectPath(value, "")).toBe("");
  });

  it("preserves an exact recruiter invitation throughout authentication", () => {
    const path = `/company/invitations/${"a".repeat(43)}`;
    expect(getSafeRedirectPath(path, "")).toBe(path);
  });

  it("supports a caller-provided fallback", () => {
    expect(getSafeRedirectPath(undefined, "/")).toBe("/");
  });
});

describe("parseJsonValue", () => {
  it("parses objects, arrays, and primitive JSON values", () => {
    expect(parseJsonValue('{"stage":"idea","votes":2}')).toEqual({
      ok: true,
      value: { stage: "idea", votes: 2 },
    });
    expect(parseJsonValue("[true, null, \"ready\"]")).toEqual({
      ok: true,
      value: [true, null, "ready"],
    });
  });

  it("defaults blank input to an object", () => {
    expect(parseJsonValue("  ")).toEqual({ ok: true, value: {} });
  });

  it("rejects malformed and non-finite JSON values", () => {
    expect(parseJsonValue("{not json")).toEqual({ ok: false, error: "Data must be valid JSON." });
    expect(isJsonValue(Number.NaN)).toBe(false);
    expect(isJsonValue(new Date())).toBe(false);
  });
});


describe("getSafeAuthCallbackPath", () => {
  it("allows the one recovery hop back to an invitation", () => {
    const invitation = `/company/invitations/${"a".repeat(43)}`;
    const recovery = `/update-password?next=${encodeURIComponent(invitation)}`;
    expect(getSafeAuthCallbackPath(recovery)).toBe(recovery);
  });

  it.each([
    "/update-password?next=https://example.com",
    "/update-password?next=%2Flogin%3Fnext%3D%2Fcompany",
    "/update-password?next=%2Fcompany&next=%2Fdashboard",
    "/update-password?next=%2Fcompany&extra=1",
    "/update-password?next=%2Fcompany#extra",
    "/login?next=%2Fcompany",
  ])("rejects unsafe or extra recovery nesting: %s", (value) => {
    expect(getSafeAuthCallbackPath(value)).toBe("");
  });
});
