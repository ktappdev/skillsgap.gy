import { RecruiterInviteForm } from "@/components/company/recruiter-invite-form";
import { TeamAccessList } from "@/components/company/team-access-list";
import { ManagementNav } from "@/components/skillsgap/management-nav";
import { requireApprovedCompanyMember } from "@/lib/auth/queries";

export default async function CompanyTeamPage() {
  const { supabase, companyId, companyRole } = await requireApprovedCompanyMember();
  const canManage = companyRole === "owner";
  const [{ data: members }, { data: invitations }] = await Promise.all([
    supabase.from("company_members").select("user_id,role,invited_email,created_at").eq("company_id", companyId).order("created_at"),
    canManage
      ? supabase.from("company_recruiter_invitations").select("id,email,expires_at").eq("company_id", companyId).is("accepted_at", null).is("revoked_at", null).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Company workspace</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Team access</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Owners control who can manage roles, candidates, and job fairs. Recruiters use their own SkillsGap.gy account.</p>
      <div className="mt-7"><ManagementNav area="company" /></div>
      <div className="mt-8 space-y-8">
        {canManage ? <RecruiterInviteForm /> : (
          <section className="border border-border bg-surface-muted p-5 text-sm leading-6 text-muted">Only the company owner can invite or remove recruiters.</section>
        )}
        <TeamAccessList
          canManage={canManage}
          members={(members ?? []).map((member) => ({ createdAt: member.created_at, email: member.invited_email, role: member.role, userId: member.user_id }))}
          invitations={(invitations ?? []).map((invitation) => ({ email: invitation.email, expiresAt: invitation.expires_at, id: invitation.id }))}
        />
      </div>
    </div>
  );
}
