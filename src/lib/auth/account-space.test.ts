import { describe, expect, it } from "vitest";

import { getAccountHome, getAccountNavigation, resolveAccountSpace } from "@/lib/auth/account-space";

describe("account spaces", () => {
  it("keeps applicant navigation out of company and admin spaces", () => {
    expect(getAccountNavigation("company")).toEqual([{ href: "/company", label: "Company" }]);
    expect(getAccountNavigation("admin")).toEqual([{ href: "/admin", label: "Admin" }]);
  });

  it("routes each account to its highest-priority workspace", () => {
    expect(getAccountHome(resolveAccountSpace(true, ["approved"], false))).toBe("/admin");
    expect(getAccountHome(resolveAccountSpace(false, ["approved"], false))).toBe("/company");
    expect(getAccountHome(resolveAccountSpace(false, ["pending"], false))).toBe("/company/request-access");
    expect(getAccountHome(resolveAccountSpace(false, ["rejected"], false))).toBe("/company/request-access");
    expect(getAccountHome(resolveAccountSpace(false, [], false))).toBe("/dashboard");
  });

  it("resolves provider space for a provider owner", () => {
    expect(resolveAccountSpace(false, [], true)).toBe("provider");
    expect(resolveAccountSpace(false, ["pending"], true)).toBe("provider");
  });

  it("keeps approved-company priority above provider", () => {
    expect(resolveAccountSpace(false, ["approved"], true)).toBe("company");
  });

  it("routes provider accounts to the provider home", () => {
    expect(getAccountHome("provider")).toBe("/provider");
  });

  it("returns provider navigation for provider space", () => {
    expect(getAccountNavigation("provider")).toEqual([{ href: "/provider", label: "Provider" }]);
  });
});
