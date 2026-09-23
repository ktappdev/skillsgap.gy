import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc, requireUser, revalidatePath } = vi.hoisted(() => ({
  rpc: vi.fn(),
  requireUser: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/queries", () => ({ requireUser, requireApprovedCompanyOwner: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/env", () => ({ env: { siteUrl: "https://skillsgap.gy" } }));

import { acceptRecruiterInvitation } from "@/lib/company/team-actions";
import { hashRecruiterInvitationToken } from "@/lib/company/recruiter-invitations";

const token = "a".repeat(43);

describe("acceptRecruiterInvitation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requireUser.mockResolvedValue({ supabase: { rpc } });
  });

  it("preserves the invitation for authentication and delegates eligibility to the RPC", async () => {
    rpc.mockResolvedValue({ error: null });
    await expect(acceptRecruiterInvitation(token)).resolves.toEqual({ redirectTo: "/company?joined=1" });
    expect(requireUser).toHaveBeenCalledWith(`/company/invitations/${token}`);
    expect(rpc).toHaveBeenCalledWith("accept_company_recruiter_invitation", { target_token_hash: hashRecruiterInvitationToken(token) });
  });

  it("explains account-purpose refusal only after the RPC validates the invitation", async () => {
    rpc.mockResolvedValue({ error: { message: "A company account is required to accept a recruiter invitation" } });
    expect((await acceptRecruiterInvitation(token)).error).toContain("Applicant and training provider accounts cannot accept");
  });

  it.each(["invalid", "expired", "revoked", "email mismatch", "another company", "database unavailable"])("keeps %s failures non-disclosing", async (message) => {
    rpc.mockResolvedValue({ error: { message } });
    expect(await acceptRecruiterInvitation(token)).toEqual({ error: "This invitation is invalid, expired, or belongs to a different email address." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("does not submit malformed tokens", async () => {
    await acceptRecruiterInvitation("invalid");
    expect(rpc).not.toHaveBeenCalled();
  });
});
