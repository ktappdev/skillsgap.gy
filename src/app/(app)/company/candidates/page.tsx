import Link from "next/link";

import { ConsentedResumeButton } from "@/components/skillsgap/consented-resume-button";
import { DirectInterviewButton } from "@/components/skillsgap/direct-interview-button";
import { ManagementNav } from "@/components/skillsgap/management-nav";
import { requireApprovedCompanyMember } from "@/lib/auth/queries";

function candidateKey(applicantId: string, roleId: string) {
  return `${applicantId}:${roleId}`;
}

export default async function CandidatesPage() {
  const { supabase, companyId } = await requireApprovedCompanyMember();
  const { data: roles } = await supabase.from("job_roles").select("*").eq("company_id", companyId).eq("status", "active");
  const roleRows = roles ?? [];
  const roleIds = roleRows.map((role) => role.id);
  const { data: matches } = roleIds.length > 0
    ? await supabase.from("job_matches").select("*").in("job_role_id", roleIds).eq("status", "current").order("score", { ascending: false })
    : { data: [] };
  const matchRows = matches ?? [];
  const { data: gaps } = matchRows.length > 0
    ? await supabase.from("match_gaps").select("match_id").in("match_id", matchRows.map((match) => match.id))
    : { data: [] };
  const gapCounts = new Map<string, number>();
  for (const gap of gaps ?? []) gapCounts.set(gap.match_id, (gapCounts.get(gap.match_id) ?? 0) + 1);

  const { data: applications } = roleIds.length > 0
    ? await supabase.from("job_applications").select("applicant_id,job_role_id,status").eq("company_id", companyId).eq("status", "applied").in("job_role_id", roleIds)
    : { data: [] };
  const appliedCandidates = new Set((applications ?? []).map((application) => candidateKey(application.applicant_id, application.job_role_id)));
  const { data: directInvitations } = roleIds.length > 0
    ? await supabase.from("interview_invitations").select("id,applicant_id,job_role_id").is("job_fair_id", null).eq("status", "invited").in("job_role_id", roleIds)
    : { data: [] };
  const directInvitationByCandidate = new Map((directInvitations ?? []).map((invitation) => [candidateKey(invitation.applicant_id, invitation.job_role_id), invitation.id]));

  const { data: consents } = matchRows.length > 0
    ? await supabase.from("candidate_consents").select("applicant_id,job_role_id").eq("company_id", companyId).eq("status", "active").in("job_role_id", roleIds)
    : { data: [] };
  const consentedMatches = new Set((consents ?? []).map((consent) => candidateKey(consent.applicant_id, consent.job_role_id)));
  const consentedProfiles = await Promise.all((consents ?? []).map(async (consent) => {
    const { data } = await supabase.rpc("get_consented_candidate_profile", {
      target_applicant_id: consent.applicant_id,
      target_job_role_id: consent.job_role_id,
    });
    return [
      candidateKey(consent.applicant_id, consent.job_role_id),
      data?.[0] ?? null,
    ] as const;
  }));
  const profileByConsent = new Map(consentedProfiles);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Company workspace</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Matched candidates</h1>
      <p className="mt-3 text-sm leading-6 text-muted">Identity is hidden until an applicant shares their profile or confirms a fair-based interview.</p>
      <div className="mt-7"><ManagementNav area="company" /></div>
      {matchRows.length === 0 ? (
        <section className="mt-8 border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-xl font-semibold">No matches yet</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Publish an active role with weighted requirements. Applicants will appear here after their CVs are processed.</p>
          <Link href="/company/jobs" className="mt-5 inline-flex text-sm font-semibold text-accent underline-offset-4 hover:underline">Manage roles →</Link>
        </section>
      ) : (
        <div className="mt-8 space-y-3">
          {matchRows.map((match, index) => {
            const role = roleRows.find((item) => item.id === match.job_role_id);
            const key = candidateKey(match.applicant_id, match.job_role_id);
            const isApplied = appliedCandidates.has(key);
            const directInvitationId = directInvitationByCandidate.get(key);
            const isConsented = consentedMatches.has(key);
            const profile = profileByConsent.get(key);
            return (
              <article key={match.id} className="flex flex-col justify-between gap-4 border border-border bg-surface p-5 shadow-sm sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted">Candidate {String(index + 1).padStart(2, "0")} · {role?.title ?? "Active role"}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {isApplied ? <span className="bg-teal-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-accent">Applied</span> : null}
                  </div>
                  {isConsented ? <><p className="mt-2 text-sm font-semibold text-foreground">{profile?.full_name || "Applicant profile shared"}</p><p className="mt-1 text-sm text-muted">Profile shared for this role{profile?.phone_number ? ` · ${profile.phone_number}` : ""}</p><div className="mt-3"><ConsentedResumeButton applicantId={match.applicant_id} roleId={match.job_role_id} /></div></> : <><p className="mt-2 text-sm font-semibold text-foreground">{match.interview_eligible ? "Eligible for invitation" : `${gapCounts.get(match.id) ?? 0} requirement${gapCounts.get(match.id) === 1 ? "" : "s"} remaining`}</p><p className="mt-1 text-sm text-muted">Anonymized profile · consent required for identity and CV</p></>}
                  {(isApplied || directInvitationId) && role ? <div className="mt-4"><DirectInterviewButton applicantId={match.applicant_id} roleId={role.id} initialInvitationId={directInvitationId} /></div> : null}
                </div>
                <span className="w-fit bg-teal-50 px-3 py-1.5 text-sm font-semibold text-accent">{match.score}% match</span>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
