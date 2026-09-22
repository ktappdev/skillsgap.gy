import { AuthSessionMissingError } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCompanySignupState } from "./company-state";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn(), home: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: mocks.getUser }, from: mocks.from }) }));
vi.mock("@/lib/auth/queries", () => ({ resolveUserHome: mocks.home }));

function setup(accountType = "company", status?: string, lookupError = false) {
  mocks.from.mockImplementation((table: string) => {
    const result = {
      data: table === "profiles" ? { account_type: accountType }
        : table === "company_members" ? status ? [{ company_id: "company-id" }] : []
          : [{ id: "company-id", status }],
      error: lookupError ? { message: "unavailable" } : null,
    };
    return { select: () => ({ eq: () => ({ ...result, maybeSingle: async () => result }), in: async () => result }) };
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "user", email: "employer@example.com" } }, error: null });
  mocks.home.mockResolvedValue("/dashboard");
  setup();
});

describe("company signup state", () => {
  it("allows a missing session", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: new AuthSessionMissingError() });
    expect(await getCompanySignupState()).toEqual({ kind: "signed-out" });
  });
  it("does not interpret auth outages as signed-out", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: new Error("offline") });
    expect(await getCompanySignupState()).toEqual({ kind: "unavailable" });
  });
  it("treats database failures as retryable", async () => {
    setup("company", undefined, true);
    expect(await getCompanySignupState()).toEqual({ kind: "unavailable" });
  });
  it.each([undefined, "pending", "rejected"])("routes unfinished company accounts (%s) to setup", async (status) => {
    setup("company", status);
    expect(await getCompanySignupState()).toEqual({ kind: "incomplete" });
  });
  it.each(["company", "applicant"])("retains approved memberships for %s accounts", async (account) => {
    setup(account, "approved");
    expect(await getCompanySignupState()).toEqual({ kind: "approved" });
  });
  it.each(["applicant", "provider"])("separates %s accounts", async (account) => {
    setup(account);
    expect(await getCompanySignupState()).toEqual({ kind: "different-account", email: "employer@example.com", home: "/dashboard" });
  });
});
