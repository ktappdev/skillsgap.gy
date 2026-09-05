import { describe, expect, it } from "vitest";

import { getAccountHome, getAccountNavigation, resolveAccountSpace } from "@/lib/auth/account-space";

describe("account spaces", () => {
  it("keeps applicant navigation out of company and admin spaces", () => {
    expect(getAccountNavigation("company")).toEqual([{ href: "/company", label: "Company" }]);
    expect(getAccountNavigation("admin")).toEqual([{ href: "/admin", label: "Admin" }]);
  });

  it("routes each account to its highest-priority workspace", () => {
    expect(getAccountHome(resolveAccountSpace(true, ["approved"]))).toBe("/admin");
    expect(getAccountHome(resolveAccountSpace(false, ["approved"]))).toBe("/company");
    expect(getAccountHome(resolveAccountSpace(false, ["pending"]))).toBe("/company/request-access");
    expect(getAccountHome(resolveAccountSpace(false, ["rejected"]))).toBe("/company/request-access");
    expect(getAccountHome(resolveAccountSpace(false, []))).toBe("/dashboard");
  });
});
