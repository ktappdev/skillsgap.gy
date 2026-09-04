import { describe, expect, it } from "vitest";

import { getSafeRedirectPath, isJsonValue, parseJsonValue } from "@/lib/validation";

describe("getSafeRedirectPath", () => {
  it("keeps an internal path", () => {
    expect(getSafeRedirectPath("/dashboard?tab=items")).toBe("/dashboard?tab=items");
  });

  it("falls back for external or protocol-relative paths", () => {
    expect(getSafeRedirectPath("https://example.com")).toBe("/dashboard");
    expect(getSafeRedirectPath("//example.com")).toBe("/dashboard");
    expect(getSafeRedirectPath("/\\\\example.com")).toBe("/dashboard");
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
