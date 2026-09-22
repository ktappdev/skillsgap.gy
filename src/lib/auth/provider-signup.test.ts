import { describe, expect, it } from "vitest";

import { getProviderSignupNext } from "@/lib/auth/provider-signup";

describe("getProviderSignupNext", () => {
  it("always starts provider registration at setup", () => {
    expect(getProviderSignupNext(null)).toBe("/provider/setup");
    expect(getProviderSignupNext("/provider/programs")).toBe("/provider/setup");
    expect(getProviderSignupNext("/dashboard")).toBe("/provider/setup");
    expect(getProviderSignupNext("https://example.com")).toBe("/provider/setup");
  });
});
