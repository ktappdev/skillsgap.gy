import { describe, expect, it } from "vitest";

import { getCompanyReturnPath, getCompanySignupNext } from "@/lib/auth/company-signup";
import { createRecruiterInvitationToken } from "@/lib/company/recruiter-invitations";

describe("getCompanySignupNext", () => {
  it("defaults to the company access request", () => {
    expect(getCompanySignupNext(null)).toBe("/company/request-access");
    expect(getCompanySignupNext("/dashboard")).toBe("/company/request-access");
    expect(getCompanySignupNext("https://example.com")).toBe("/company/request-access");
  });

  it("preserves valid recruiter invitation paths", () => {
    const token = createRecruiterInvitationToken();

    expect(getCompanySignupNext(`/company/invitations/${token}`)).toBe(`/company/invitations/${token}`);
  });

  it("rejects malformed or nested invitation paths", () => {
    expect(getCompanySignupNext("/company/invitations/not-a-token")).toBe("/company/request-access");
    expect(getCompanySignupNext("/company/invitations/not-a-token/extra")).toBe("/company/request-access");
  });
});

describe("getCompanyReturnPath", () => {
  it.each(["/signup/company", "/company/request-access", "/company", "/company/jobs", "/company/team", "/company/candidates", "/company/job-fairs"])("preserves %s", (path) => {
    expect(getCompanyReturnPath(path)).toBe(path);
  });
  it.each(["https://example.com", "//example.com", "/dashboard", "/company/../dashboard", "/company/jobs/extra", "/company?next=/dashboard", "/signup/company?next=https://example.com", "/company%2fteam", "/company#next", "/company\n"])("rejects %s", (path) => {
    expect(getCompanyReturnPath(path)).toBe("/signup/company");
  });
});
