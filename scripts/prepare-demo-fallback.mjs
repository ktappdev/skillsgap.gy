#!/usr/bin/env node
/**
 * Prepare the non-sensitive fallback applicant used when Thunder inference is
 * unavailable during the hackathon demo. The script writes confirmed, curated
 * qualifications and deterministic match results directly to the database; it
 * never creates a resume or claims the results came from OCR or Qwen.
 *
 * Usage:
 *   node --env-file=.env.local scripts/prepare-demo-fallback.mjs
 *
 * Required environment:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEMO_APPLICANT_EMAIL
 */

import { createClient } from "@supabase/supabase-js";

const fallbackRoleId = "40000000-0000-0000-0000-000000000001";
const fallbackFairId = "50000000-0000-0000-0000-000000000001";
const fallbackCompanyId = "10000000-0000-0000-0000-000000000001";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}. Set it in .env.local.`);
  return value;
}

function failIfError(error, action) {
  if (error) throw new Error(`${action}: ${error.message}`);
}

function isRequirementSatisfied(requirement, qualifications) {
  const years = qualifications.get(requirement.qualification_id);
  return years !== undefined && (requirement.minimum_years === null || years >= requirement.minimum_years);
}

if (process.env.NODE_ENV === "production" && !process.argv.includes("--force")) {
  throw new Error("Refusing to prepare demo data with NODE_ENV=production. Re-run with --force after checking the target.");
}

const supabase = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { error: schemaError } = await supabase.from("job_applications").select("id").limit(1);
if (schemaError) throw new Error("The applications migration must be deployed before preparing the fallback applicant.");

const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
failIfError(usersError, "Could not read demo users");

const applicant = users.users.find((user) => user.email === required("DEMO_APPLICANT_EMAIL"));
if (!applicant) throw new Error("The demo applicant does not exist. Run scripts/setup-demo-users.mjs first.");

const { error: profileError } = await supabase.from("profiles").upsert({
  id: applicant.id,
  full_name: "Prepared demo applicant",
  parish_or_region: "Georgetown",
  onboarding_completed: true,
});
failIfError(profileError, "Could not prepare fallback profile");

const fallbackSkills = [
  { slug: "diesel-mechanics", years: 4, originalTerm: "Minibus diesel repair" },
  { slug: "mechanical-maintenance", years: 4, originalTerm: "Mechanical maintenance" },
  { slug: "bosiet", years: 0, originalTerm: "BOSIET certificate" },
];

const { data: qualifications, error: qualificationsError } = await supabase
  .from("qualifications")
  .select("id,slug")
  .in("slug", fallbackSkills.map((skill) => skill.slug));
failIfError(qualificationsError, "Could not read fallback qualifications");

if ((qualifications ?? []).length !== fallbackSkills.length) throw new Error("The curated qualification taxonomy is incomplete.");

const qualificationBySlug = new Map((qualifications ?? []).map((qualification) => [qualification.slug, qualification.id]));

const { error: removeQualificationsError } = await supabase
  .from("applicant_qualifications")
  .delete()
  .eq("applicant_id", applicant.id);
failIfError(removeQualificationsError, "Could not reset fallback qualifications");

const { error: insertQualificationsError } = await supabase.from("applicant_qualifications").insert(
  fallbackSkills.map((skill) => ({
    applicant_id: applicant.id,
    qualification_id: qualificationBySlug.get(skill.slug),
    years_experience: skill.years,
    source: "applicant_confirmed",
    review_status: "confirmed",
    original_term: skill.originalTerm,
    evidence: "Prepared non-sensitive fallback scenario for the hackathon demo.",
    confidence: 1,
  })),
);
failIfError(insertQualificationsError, "Could not add fallback qualifications");

const { data: roles, error: rolesError } = await supabase
  .from("job_roles")
  .select("id,eligibility_threshold")
  .eq("status", "active")
  .eq("is_demo", true);
failIfError(rolesError, "Could not read active roles");
if (!roles || roles.length === 0) throw new Error("No active curated roles are available.");

const { data: requirements, error: requirementsError } = await supabase
  .from("job_requirements")
  .select("id,job_role_id,qualification_id,weight,minimum_years,mandatory")
  .in("job_role_id", roles.map((role) => role.id));
failIfError(requirementsError, "Could not read role requirements");

const skillYears = new Map(fallbackSkills.map((skill) => [qualificationBySlug.get(skill.slug), skill.years]));
const requirementsByRole = new Map(roles.map((role) => [role.id, (requirements ?? []).filter((requirement) => requirement.job_role_id === role.id)]));

const { error: removeInvitationsError } = await supabase
  .from("interview_invitations")
  .delete()
  .eq("applicant_id", applicant.id);
failIfError(removeInvitationsError, "Could not reset fallback invitations");

const { error: removeApplicationsError } = await supabase
  .from("job_applications")
  .delete()
  .eq("applicant_id", applicant.id);
failIfError(removeApplicationsError, "Could not reset fallback applications");

const { error: removeMatchesError } = await supabase
  .from("job_matches")
  .delete()
  .eq("applicant_id", applicant.id);
failIfError(removeMatchesError, "Could not reset fallback matches");

const matchRows = roles.map((role) => {
  const roleRequirements = requirementsByRole.get(role.id) ?? [];
  const totalWeight = roleRequirements.reduce((total, requirement) => total + requirement.weight, 0);
  const matchedWeight = roleRequirements
    .filter((requirement) => isRequirementSatisfied(requirement, skillYears))
    .reduce((total, requirement) => total + requirement.weight, 0);
  const mandatoryRequirementsMet = roleRequirements
    .filter((requirement) => requirement.mandatory)
    .every((requirement) => isRequirementSatisfied(requirement, skillYears));
  const score = totalWeight === 0 ? 0 : Math.round((matchedWeight * 100) / totalWeight);

  return {
    applicant_id: applicant.id,
    job_role_id: role.id,
    score,
    mandatory_requirements_met: mandatoryRequirementsMet,
    interview_eligible: mandatoryRequirementsMet && score >= role.eligibility_threshold,
    status: "current",
  };
});

const { data: matches, error: matchesError } = await supabase
  .from("job_matches")
  .insert(matchRows)
  .select("id,job_role_id");
failIfError(matchesError, "Could not create fallback matches");

const matchByRole = new Map((matches ?? []).map((match) => [match.job_role_id, match.id]));
const gapRows = (requirements ?? []).flatMap((requirement) => (
  isRequirementSatisfied(requirement, skillYears)
    ? []
    : [{ match_id: matchByRole.get(requirement.job_role_id), job_requirement_id: requirement.id, status: "unresolved" }]
));

if (gapRows.some((gap) => !gap.match_id)) throw new Error("Could not connect a fallback gap to its match.");
const { error: gapsError } = await supabase.from("match_gaps").insert(gapRows);
failIfError(gapsError, "Could not create fallback gaps");

const selectedMatch = matchRows.find((match) => match.job_role_id === fallbackRoleId);
if (!selectedMatch?.interview_eligible) throw new Error("The fallback role is not interview eligible; check curated requirements.");

const { error: invitationError } = await supabase.from("interview_invitations").insert({
  applicant_id: applicant.id,
  job_role_id: fallbackRoleId,
  job_fair_id: fallbackFairId,
  status: "pending",
});
failIfError(invitationError, "Could not create fallback invitation");

const { error: clearConsentError } = await supabase
  .from("candidate_consents")
  .delete()
  .eq("applicant_id", applicant.id)
  .eq("company_id", fallbackCompanyId)
  .eq("job_role_id", fallbackRoleId);
failIfError(clearConsentError, "Could not clear fallback consent");

const { error: completedJobsError } = await supabase
  .from("processing_jobs")
  .update({ status: "completed", completed_at: new Date().toISOString(), error_message: null })
  .eq("applicant_id", applicant.id)
  .eq("kind", "recalculate_matches")
  .in("status", ["queued", "processing", "failed"]);
failIfError(completedJobsError, "Could not settle fallback recalculation jobs");

console.log(`Prepared ${matchRows.length} deterministic fallback matches, including one eligible interview invitation.`);
