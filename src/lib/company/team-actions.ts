"use server";

import { revalidatePath } from "next/cache";

import {
  createRecruiterInvitationToken,
  hashRecruiterInvitationToken,
  isRecruiterEmail,
  isRecruiterInvitationToken,
  normalizeRecruiterEmail,
} from "@/lib/company/recruiter-invitations";
import { requireApprovedCompanyOwner, requireUser } from "@/lib/auth/queries";
import { getDatabaseErrorMessage } from "@/lib/errors";
import { env } from "@/lib/env";
import { isUuid } from "@/lib/validation";

export type RecruiterInviteState = {
  email?: string;
  error?: string;
  inviteUrl?: string;
  message?: string;
};

export async function createRecruiterInvitation(
  _previousState: RecruiterInviteState,
  formData: FormData,
): Promise<RecruiterInviteState> {
  const { supabase, user, companyId } = await requireApprovedCompanyOwner();
  const email = normalizeRecruiterEmail(String(formData.get("email") ?? ""));

  if (!isRecruiterEmail(email)) {
    return { error: "Enter a valid recruiter email address." };
  }

  if (email === user.email?.toLowerCase()) {
    return { error: "You already have owner access to this company." };
  }

  const token = createRecruiterInvitationToken();
  const tokenHash = hashRecruiterInvitationToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000).toISOString();
  const { error } = await supabase.from("company_recruiter_invitations").upsert({
    company_id: companyId,
    email,
    token_hash: tokenHash,
    invited_by: user.id,
    expires_at: expiresAt,
    accepted_at: null,
    accepted_by: null,
    revoked_at: null,
  }, { onConflict: "company_id,email" });

  if (error) {
    return { error: getDatabaseErrorMessage(error, "We could not create that recruiter invitation.") };
  }

  revalidatePath("/company/team");
  return {
    email,
    inviteUrl: `${env.siteUrl}/company/invitations/${token}`,
    message: "Recruiter invitation created. Send this private link to the recruiter.",
  };
}

export async function revokeRecruiterInvitation(invitationId: string): Promise<{ error?: string }> {
  const { supabase, companyId } = await requireApprovedCompanyOwner();
  if (!isUuid(invitationId)) return { error: "That invitation is not valid." };

  const { error } = await supabase
    .from("company_recruiter_invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", invitationId)
    .eq("company_id", companyId)
    .is("accepted_at", null);

  if (error) return { error: getDatabaseErrorMessage(error, "We could not revoke that invitation.") };
  revalidatePath("/company/team");
  return {};
}

export async function removeRecruiter(userId: string): Promise<{ error?: string }> {
  const { supabase, companyId } = await requireApprovedCompanyOwner();
  if (!isUuid(userId)) return { error: "That recruiter account is not valid." };

  const { error } = await supabase
    .from("company_members")
    .delete()
    .eq("company_id", companyId)
    .eq("user_id", userId)
    .eq("role", "recruiter");

  if (error) return { error: getDatabaseErrorMessage(error, "We could not remove that recruiter.") };
  revalidatePath("/company/team");
  return {};
}

export async function acceptRecruiterInvitation(token: string): Promise<{ error?: string; redirectTo?: string }> {
  const { supabase } = await requireUser(`/company/invitations/${token}`);
  if (!isRecruiterInvitationToken(token)) return { error: "That recruiter invitation is not valid." };

  const { error } = await supabase.rpc("accept_company_recruiter_invitation", {
    target_token_hash: hashRecruiterInvitationToken(token),
  });

  if (error) {
    if (error.message === "A company account is required to accept a recruiter invitation") {
      return { error: "Applicant and training provider accounts cannot accept recruiter invitations. Sign out and use a separate company account with the invited email address." };
    }
    return { error: "This invitation is invalid, expired, or belongs to a different email address." };
  }

  revalidatePath("/company", "layout");
  return { redirectTo: "/company?joined=1" };
}
