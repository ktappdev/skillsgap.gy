import { describe, expect, it } from "vitest";

import { getAuthErrorMessage, getDatabaseErrorMessage } from "@/lib/errors";

describe("getAuthErrorMessage", () => {
  it("maps common Supabase Auth errors to useful copy", () => {
    expect(getAuthErrorMessage(new Error("Invalid login credentials"))).toContain("not recognized");
    expect(getAuthErrorMessage(new Error("Email not confirmed"))).toContain("confirm your email");
    expect(getAuthErrorMessage(new Error("User already registered"))).toContain("already exists");
  });

  it("does not expose unknown provider errors", () => {
    expect(getAuthErrorMessage(new Error("internal database details"))).toBe(
      "We could not complete that authentication request. Please try again.",
    );
  });
});

describe("getDatabaseErrorMessage", () => {
  it("maps constraint conflicts", () => {
    expect(getDatabaseErrorMessage({ code: "23505" }, "fallback")).toContain("already in use");
    expect(getDatabaseErrorMessage({ code: "23514" }, "fallback")).toContain("check the values");
  });

  it("uses the caller fallback for unknown errors", () => {
    expect(getDatabaseErrorMessage({ code: "42P01" }, "Could not save.")).toBe("Could not save.");
  });
});
