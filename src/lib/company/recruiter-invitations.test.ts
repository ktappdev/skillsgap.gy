import { describe, expect, it } from "vitest";

import {
  createRecruiterInvitationToken,
  hashRecruiterInvitationToken,
  isRecruiterEmail,
  isRecruiterInvitationToken,
  normalizeRecruiterEmail,
} from "@/lib/company/recruiter-invitations";

describe("recruiter invitations", () => {
  it("creates URL-safe tokens with stable hashes", () => {
    const token = createRecruiterInvitationToken();

    expect(isRecruiterInvitationToken(token)).toBe(true);
    expect(hashRecruiterInvitationToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashRecruiterInvitationToken(token)).toBe(hashRecruiterInvitationToken(token));
  });

  it("normalizes and validates recruiter email addresses", () => {
    expect(normalizeRecruiterEmail(" Recruiter@Example.com ")).toBe("recruiter@example.com");
    expect(isRecruiterEmail("recruiter@example.com")).toBe(true);
    expect(isRecruiterEmail("not-an-email")).toBe(false);
  });
});
