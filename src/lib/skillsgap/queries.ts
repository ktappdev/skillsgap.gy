import type { SupabaseClient } from "@supabase/supabase-js";

import type { Match } from "@/lib/skillsgap-demo";
import type { Database, Json, Tables } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export type ApplicantProgress = {
  latestResume: Tables<"resumes"> | null;
  processingStatus: Tables<"processing_jobs">["status"] | null;
  processingError: string | null;
  unmappedTerms: string[];
  experience: Tables<"applicant_experience">[];
  matches: Match[];
  qualifications: ApplicantQualificationView[];
  availableQualifications: Tables<"qualifications">[];
};

export type ApplicantQualificationView = Tables<"applicant_qualifications"> & { qualificationName: string };

export async function getApplicantProgress(client: Client, applicantId: string): Promise<ApplicantProgress> {
  const [resumeResult, jobResult, matchesResult, experienceResult] = await Promise.all([
    client.from("resumes").select("*").eq("applicant_id", applicantId).is("deleted_at", null).order("uploaded_at", { ascending: false }).limit(1).maybeSingle(),
    client.from("processing_jobs").select("*").eq("applicant_id", applicantId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    client.from("job_matches").select("*").eq("applicant_id", applicantId).eq("status", "current").order("score", { ascending: false }),
    client.from("applicant_experience").select("*").eq("applicant_id", applicantId).order("created_at", { ascending: false }),
  ]);

  const currentMatches = matchesResult.data ?? [];
  const unmappedTerms = getUnmappedTerms(jobResult.data?.result_summary);
  const currentRoleIds = currentMatches.map((row) => row.job_role_id);
  const activeRoleResult = currentRoleIds.length > 0
    ? await client.from("job_roles").select("id,company_id").in("id", currentRoleIds).eq("status", "active")
    : { data: [] };
  const activeRoles = activeRoleResult.data ?? [];
  const activeCompanyIds = [...new Set(activeRoles.map((role) => role.company_id))];
  const approvedCompaniesResult = activeCompanyIds.length > 0
    ? await client.from("companies").select("id").in("id", activeCompanyIds).eq("status", "approved")
    : { data: [] };
  const approvedCompanyIds = new Set((approvedCompaniesResult.data ?? []).map((company) => company.id));
  const activeRoleIds = new Set(activeRoles.filter((role) => approvedCompanyIds.has(role.company_id)).map((role) => role.id));
  const rows = currentMatches.filter((row) => activeRoleIds.has(row.job_role_id)).slice(0, 3);
  if (rows.length === 0) {
    return { latestResume: resumeResult.data, processingStatus: jobResult.data?.status ?? null, processingError: jobResult.data?.error_message ?? null, unmappedTerms, experience: experienceResult.data ?? [], matches: [], qualifications: await getApplicantQualifications(client, applicantId), availableQualifications: await getAvailableQualifications(client) };
  }

  const roleIds = rows.map((row) => row.job_role_id);
  const roleResult = await client.from("job_roles").select("*").in("id", roleIds).eq("status", "active");
  const roles = roleResult.data ?? [];
  const companyIds = [...new Set(roles.map((role) => role.company_id))];
  const companyResult = companyIds.length > 0 ? await client.from("companies").select("id,name").in("id", companyIds).eq("status", "approved") : { data: [] };
  const companies = companyResult.data ?? [];
  const companyNames = new Map(companies.map((company) => [company.id, company.name]));

  const gapResult = await client.from("match_gaps").select("*").in("match_id", rows.map((row) => row.id));
  const gaps = gapResult.data ?? [];
  const requirementIds = [...new Set(gaps.map((gap) => gap.job_requirement_id))];
  const roleRequirementResult = await client.from("job_requirements").select("*").in("job_role_id", roleIds);
  const allRequirements = roleRequirementResult.data ?? [];
  const requirements = requirementIds.length > 0 ? allRequirements.filter((requirement) => requirementIds.includes(requirement.id)) : [];
  const qualificationIds = [...new Set(allRequirements.map((requirement) => requirement.qualification_id))];
  const qualificationResult = qualificationIds.length > 0 ? await client.from("qualifications").select("id,name,category").in("id", qualificationIds) : { data: [] };
  const qualifications = qualificationResult.data ?? [];
  const qualificationNames = new Map(qualifications.map((qualification) => [qualification.id, qualification.name]));
  const requirementById = new Map(requirements.map((requirement) => [requirement.id, requirement]));
  const applicantQualificationResult = await client.from("applicant_qualifications").select("qualification_id").eq("applicant_id", applicantId).eq("review_status", "confirmed");
  const applicantQualificationIds = new Set((applicantQualificationResult.data ?? []).map((item) => item.qualification_id));

  return {
    latestResume: resumeResult.data,
    processingStatus: jobResult.data?.status ?? null,
    processingError: jobResult.data?.error_message ?? null,
    unmappedTerms,
    experience: experienceResult.data ?? [],
    qualifications: await getApplicantQualifications(client, applicantId),
    availableQualifications: await getAvailableQualifications(client),
    matches: rows.flatMap((row) => {
      const role = roles.find((item) => item.id === row.job_role_id);
      if (!role || !approvedCompanyIds.has(role.company_id)) return [];
      const roleGaps = gaps.filter((gap) => gap.match_id === row.id);
      const mappedGaps = roleGaps.flatMap((gap) => {
        const requirement = requirementById.get(gap.job_requirement_id);
        if (!requirement) return [];
        return [{
          id: gap.id,
          name: qualificationNames.get(requirement.qualification_id) ?? "Qualification to verify",
          type: requirement.kind === "certification" ? "Certification" as const : requirement.kind === "experience" ? "Experience" as const : "Technical skill" as const,
          training: null,
          status: gap.status,
        }];
      });
      const strengths = allRequirements
        .filter((requirement) => requirement.job_role_id === role.id && applicantQualificationIds.has(requirement.qualification_id))
        .map((requirement) => qualificationNames.get(requirement.qualification_id))
        .filter((name): name is string => Boolean(name));
      return [{
        id: row.id,
        roleId: role.id,
        companyId: role.company_id,
        title: role.title,
        company: companyNames.get(role.company_id) ?? "Approved contractor",
        score: row.score,
        threshold: role.eligibility_threshold,
        eligible: row.interview_eligible,
        strengths: strengths.length > 0 ? strengths : ["Profile qualification recognized"],
        gaps: mappedGaps,
      }];
    }),
  };
}

function getUnmappedTerms(summary: Json | undefined): string[] {
  if (!summary || Array.isArray(summary) || typeof summary !== "object") return [];
  const terms = summary.unmapped_terms;
  if (!Array.isArray(terms)) return [];
  return terms.filter((term): term is string => typeof term === "string");
}

export async function getApplicantQualifications(client: Client, applicantId: string): Promise<ApplicantQualificationView[]> {
  const { data: rows } = await client.from("applicant_qualifications").select("*").eq("applicant_id", applicantId).order("created_at");
  if (!rows || rows.length === 0) return [];
  const { data: qualifications } = await client.from("qualifications").select("id,name").in("id", rows.map((row) => row.qualification_id));
  const names = new Map((qualifications ?? []).map((qualification) => [qualification.id, qualification.name]));
  return rows.map((row) => ({ ...row, qualificationName: names.get(row.qualification_id) ?? "Qualification to verify" }));
}

async function getAvailableQualifications(client: Client): Promise<Tables<"qualifications">[]> {
  const { data } = await client.from("qualifications").select("*").eq("is_active", true).order("name");
  return data ?? [];
}

export async function getApplicantMatch(client: Client, applicantId: string, matchId: string): Promise<Match | null> {
  const { data: match } = await client.from("job_matches").select("*").eq("id", matchId).eq("applicant_id", applicantId).eq("status", "current").maybeSingle();
  if (!match) return null;

  const { data: role } = await client.from("job_roles").select("*").eq("id", match.job_role_id).eq("status", "active").maybeSingle();
  if (!role) return null;
  const [{ data: company }, { data: gaps }, { data: requirements }, { data: applicantQualifications }] = await Promise.all([
    client.from("companies").select("id,name").eq("id", role.company_id).eq("status", "approved").maybeSingle(),
    client.from("match_gaps").select("*").eq("match_id", match.id),
    client.from("job_requirements").select("*").eq("job_role_id", role.id),
    client.from("applicant_qualifications").select("qualification_id").eq("applicant_id", applicantId).eq("review_status", "confirmed"),
  ]);
  const { data: consent } = await client.from("candidate_consents").select("id").eq("applicant_id", applicantId).eq("job_role_id", role.id).eq("status", "active").maybeSingle();
  const roleRequirements = requirements ?? [];
  const requirementIds = (gaps ?? []).map((gap) => gap.job_requirement_id);
  const gapRequirements = roleRequirements.filter((requirement) => requirementIds.includes(requirement.id));
  const qualificationIds = [...new Set(roleRequirements.map((requirement) => requirement.qualification_id))];
  const { data: qualifications } = qualificationIds.length > 0 ? await client.from("qualifications").select("id,name").in("id", qualificationIds) : { data: [] };
  const names = new Map((qualifications ?? []).map((qualification) => [qualification.id, qualification.name]));
  const applicantQualificationIds = new Set((applicantQualifications ?? []).map((item) => item.qualification_id));

  const trainingQualificationIds = gapRequirements.map((requirement) => requirement.qualification_id);
  const { data: outcomes } = trainingQualificationIds.length > 0 ? await client.from("training_program_outcomes").select("training_program_id,qualification_id").in("qualification_id", trainingQualificationIds) : { data: [] };
  const programIds = [...new Set((outcomes ?? []).map((outcome) => outcome.training_program_id))];
  const { data: programs } = programIds.length > 0 ? await client.from("training_programs").select("id,name,provider_id").in("id", programIds).eq("is_active", true) : { data: [] };
  const providerIds = [...new Set((programs ?? []).map((program) => program.provider_id))];
  const { data: providers } = providerIds.length > 0 ? await client.from("training_providers").select("id,name,location").in("id", providerIds).eq("is_verified", true) : { data: [] };
  const providerById = new Map((providers ?? []).map((provider) => [provider.id, provider]));
  const trainingByQualification = new Map<string, string>();
  for (const outcome of outcomes ?? []) {
    const program = (programs ?? []).find((item) => item.id === outcome.training_program_id);
    const provider = program ? providerById.get(program.provider_id) : undefined;
    if (program && provider && !trainingByQualification.has(outcome.qualification_id)) {
      trainingByQualification.set(outcome.qualification_id, `${program.name} · ${provider.name}`);
    }
  }

  return {
    id: match.id,
    roleId: role.id,
    companyId: role.company_id,
    consented: Boolean(consent),
    title: role.title,
    company: company?.name ?? "Approved contractor",
    score: match.score,
    threshold: role.eligibility_threshold,
    eligible: match.interview_eligible,
    strengths: roleRequirements.filter((requirement) => applicantQualificationIds.has(requirement.qualification_id)).map((requirement) => names.get(requirement.qualification_id)).filter((name): name is string => Boolean(name)),
    gaps: gapRequirements.map((requirement) => ({
      id: (gaps ?? []).find((gap) => gap.job_requirement_id === requirement.id)?.id,
      name: names.get(requirement.qualification_id) ?? "Qualification to verify",
      type: requirement.kind === "certification" ? "Certification" as const : requirement.kind === "experience" ? "Experience" as const : "Technical skill" as const,
      training: trainingByQualification.get(requirement.qualification_id) ?? null,
      status: (gaps ?? []).find((gap) => gap.job_requirement_id === requirement.id)?.status,
    })),
  };
}

export type ApplicantInterview = {
  booking: Tables<"interview_bookings"> | null;
  fair: Tables<"job_fairs">;
  invitation: Tables<"interview_invitations">;
  role: Tables<"job_roles">;
  slots: Tables<"interview_slots">[];
};

export async function getApplicantInterviews(client: Client, applicantId: string): Promise<ApplicantInterview[]> {
  const { data: invitations } = await client.from("interview_invitations").select("*").eq("applicant_id", applicantId).in("status", ["pending", "accepted"]);
  if (!invitations || invitations.length === 0) return [];
  const [{ data: roles }, { data: fairs }, { data: bookings }] = await Promise.all([
    client.from("job_roles").select("*").in("id", invitations.map((item) => item.job_role_id)),
    client.from("job_fairs").select("*").in("id", invitations.map((item) => item.job_fair_id)),
    client.from("interview_bookings").select("*").in("invitation_id", invitations.map((item) => item.id)).eq("status", "confirmed"),
  ]);
  const now = new Date();
  const activeInvitations = invitations.filter((invitation) => {
    const fair = (fairs ?? []).find((item) => item.id === invitation.job_fair_id);
    const booking = (bookings ?? []).find((item) => item.invitation_id === invitation.id);
    return Boolean(booking) || Boolean(fair && fair.status === "open" && new Date(fair.ends_at) > now && (!invitation.expires_at || new Date(invitation.expires_at) > now));
  });
  const fairIds = [...new Set(activeInvitations.map((invitation) => invitation.job_fair_id))];
  const { data: slots } = fairIds.length > 0 ? await client.from("interview_slots").select("*").in("job_fair_id", fairIds).order("starts_at") : { data: [] };
  return activeInvitations.flatMap((invitation) => {
    const role = (roles ?? []).find((item) => item.id === invitation.job_role_id);
    const fair = (fairs ?? []).find((item) => item.id === invitation.job_fair_id);
    if (!role || !fair) return [];
    const booking = (bookings ?? []).find((item) => item.invitation_id === invitation.id) ?? null;
    const availableSlots = (slots ?? []).filter((slot) => slot.job_fair_id === fair.id && new Date(slot.starts_at) > now);
    return [{ invitation, role, fair, slots: booking ? (slots ?? []).filter((slot) => slot.id === booking.interview_slot_id) : availableSlots, booking }];
  });
}
