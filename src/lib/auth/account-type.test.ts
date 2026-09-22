import { describe, expect, it } from "vitest";

import { parseAccountType } from "@/lib/auth/account-type";

describe("parseAccountType", () => {
  it("accepts the three supported account purposes", () => {
    expect(parseAccountType("applicant")).toBe("applicant");
    expect(parseAccountType("company")).toBe("company");
    expect(parseAccountType("provider")).toBe("provider");
  });

  it("falls back to the job seeker account for missing or unknown input", () => {
    expect(parseAccountType(null)).toBe("applicant");
    expect(parseAccountType("admin")).toBe("applicant");
  });
});
