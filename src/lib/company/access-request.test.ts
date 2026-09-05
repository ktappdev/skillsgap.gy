import { describe, expect, it } from "vitest";

import { isCompanyDescription, normalizeCompanyWebsite } from "@/lib/company/access-request";

describe("company access requests", () => {
  it("accepts HTTP company websites and normalizes them", () => {
    expect(normalizeCompanyWebsite(" https://example.com ")).toEqual({ ok: true, value: "https://example.com/" });
    expect(normalizeCompanyWebsite("")).toEqual({ ok: true, value: null });
  });

  it("rejects unsafe website schemes and oversized descriptions", () => {
    expect(normalizeCompanyWebsite("javascript:alert(1)")).toEqual({ ok: false });
    expect(isCompanyDescription("x".repeat(2001))).toBe(false);
  });
});
