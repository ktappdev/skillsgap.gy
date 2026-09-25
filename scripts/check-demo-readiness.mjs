#!/usr/bin/env node
/**
 * Verify the auth and fallback database conditions required to present the
 * SkillsGap.gy demo. Processor health is checked when PROCESSOR_URL is set.
 *
 * Usage:
 *   node --env-file=.env.local scripts/check-demo-readiness.mjs
 */

import { createClient } from "@supabase/supabase-js";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const admin = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { autoRefreshToken: false, persistSession: false },
});
const publicClient = createClient(required("NEXT_PUBLIC_SUPABASE_URL"), required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), {
  auth: { autoRefreshToken: false, persistSession: false },
});

const demoCredentials = [
  ["DEMO_APPLICANT_EMAIL", "DEMO_APPLICANT_PASSWORD"],
  ["DEMO_OWNER_EMAIL", "DEMO_OWNER_PASSWORD"],
  ["DEMO_RECRUITER_EMAIL", "DEMO_RECRUITER_PASSWORD"],
  ["DEMO_ADMIN_EMAIL", "DEMO_ADMIN_PASSWORD"],
  ["DEMO_PROVIDER_EMAIL", "DEMO_PROVIDER_PASSWORD"],
];
const illustrativeProgramIds = Array.from({ length: 20 }, (_, index) => `30000000-0000-0000-0000-${String(index + 1).padStart(12, "0")}`);
const ictProgramIds = Array.from({ length: 5 }, (_, index) => `30000000-0000-0000-0000-${String(index + 21).padStart(12, "0")}`);
const energyProgramIds = Array.from({ length: 20 }, (_, index) => `30000000-0000-0000-0000-${String(index + 26).padStart(12, "0")}`);
const demoProgramIds = [...illustrativeProgramIds, ...ictProgramIds, ...energyProgramIds];
const ictRoleIds = Array.from({ length: 5 }, (_, index) => `40000000-0000-0000-0000-${String(index + 19).padStart(12, "0")}`);
const energyRoleIds = Array.from({ length: 5 }, (_, index) => `40000000-0000-0000-0000-${String(index + 24).padStart(12, "0")}`);
const interestRoleIds = Array.from({ length: 7 }, (_, index) => `40000000-0000-0000-0000-${String(index + 29).padStart(12, "0")}`);
const energyProviderIds = [
  "20000000-0000-0000-0000-000000000001",
  "20000000-0000-0000-0000-000000000004",
  "20000000-0000-0000-0000-000000000006",
  "20000000-0000-0000-0000-000000000007",
  "20000000-0000-0000-0000-000000000008",
  "20000000-0000-0000-0000-000000000009",
  "20000000-0000-0000-0000-000000000010",
];
const ictQualificationSlugs = [
  "software-development",
  "web-application-development",
  "database-and-sql",
  "server-administration",
  "cloud-and-devops",
  "iot-systems",
  "cybersecurity",
  "data-analysis",
  "api-development-and-integration",
  "version-control",
  "ict-network-support",
  "instrumentation-basics",
];
const energyQualificationSlugs = [
  "oil-and-gas-industry-fundamentals",
  "subsea-robotics-basics",
  "advanced-diploma-oil-and-gas",
  "production-operations",
  "offshore-production-operations",
  "environmental-stewardship",
  "oil-and-gas-procurement",
  "project-planning-and-scheduling",
  "cvq-level-3-occupational-safety-and-health",
  "asc-petroleum-engineering",
  "msc-oil-and-gas-renewable-energy",
];

for (const [emailName, passwordName] of demoCredentials) {
  const { data, error } = await publicClient.auth.signInWithPassword({
    email: required(emailName),
    password: required(passwordName),
  });
  if (error || !data.user) throw new Error(`Demo authentication failed for ${emailName}.`);
}

const { data: users, error: usersError } = await admin.auth.admin.listUsers();
if (usersError) throw new Error("Could not read demo users.");
const applicant = users.users.find((user) => user.email === required("DEMO_APPLICANT_EMAIL"));
assert(applicant, "The fallback applicant is missing.");

const [
  { data: matches, error: matchesError },
  { data: invitations, error: invitationsError },
  { data: demoRoles, error: demoRolesError },
  { data: programs, error: programsError },
  { data: providers, error: providersError },
  { data: ictQualifications, error: ictQualificationsError },
  { data: energyQualifications, error: energyQualificationsError },
  { data: energyProviders, error: energyProvidersError },
  { data: employmentActions, error: employmentActionsError },
  { data: registrationActions, error: registrationActionsError },
  { data: occupations, error: occupationsError },
  { data: activeInterests, error: interestsError },
  { data: interestMappings, error: interestMappingsError },
  { data: rolesWithOccupations, error: rolesWithOccupationsError },
] = await Promise.all([
  admin.from("job_matches").select("id,job_role_id,score,interview_eligible").eq("applicant_id", applicant.id).eq("status", "current"),
  admin.from("interview_invitations").select("id").eq("applicant_id", applicant.id).eq("status", "pending"),
  admin.from("job_roles").select("id,title,occupation_id").eq("status", "active").eq("is_demo", true),
  admin.from("training_programs").select("id,provider_id,name,description,duration_text,enrollment_url,intake_text,fee_amount,next_intake_date").in("id", demoProgramIds).eq("is_active", true),
  admin.from("training_providers").select("id").eq("is_verified", true),
  admin.from("qualifications").select("id,slug").in("slug", ictQualificationSlugs).eq("is_active", true),
  admin.from("qualifications").select("id,slug").in("slug", energyQualificationSlugs).eq("is_active", true),
  admin.from("training_providers").select("id").in("id", energyProviderIds).eq("is_verified", true),
  admin.from("occupation_pathway_actions").select("id,occupation_id").eq("action_type", "find_work").eq("url", "https://lcregister.petroleum.gov.gy/opportunities/notices-for-individual-employment/").eq("is_active", true).eq("is_verified", true),
  admin.from("occupation_pathway_actions").select("id,occupation_id").eq("action_type", "register").eq("url", "https://localcontent.gov.gy/").eq("is_active", true).eq("is_verified", true),
  admin.from("occupations").select("id,slug").eq("is_active", true),
  admin.from("career_interests").select("slug").eq("is_active", true),
  admin.from("occupation_career_interests").select("occupation_id,career_interest_slug").eq("is_active", true),
  admin.from("job_roles").select("occupation_id").eq("status", "active").eq("is_demo", true).not("occupation_id", "is", null),
]);
if (matchesError || invitationsError || demoRolesError || programsError || providersError || ictQualificationsError || energyQualificationsError || energyProvidersError || employmentActionsError || registrationActionsError || occupationsError || interestsError || interestMappingsError || rolesWithOccupationsError) {
  throw new Error("Could not read fallback demo data.");
}

assert((demoRoles ?? []).length >= 18, "The expanded catalogue needs at least 18 active curated roles.");
assert(ictRoleIds.every((roleId) => (demoRoles ?? []).some((role) => role.id === roleId)), "One or more ICT roles are missing from the active catalogue.");
assert(energyRoleIds.every((roleId) => (demoRoles ?? []).some((role) => role.id === roleId)), "One or more Guyana energy role profiles are missing from the active catalogue.");
assert(interestRoleIds.every((roleId) => (demoRoles ?? []).some((role) => role.id === roleId)), "One or more interest-coverage demo roles are missing from the active catalogue.");
assert((occupations ?? []).length === 22, "The active career catalogue must contain all 22 occupations.");
assert((activeInterests ?? []).length === 24, "The active career interest catalogue must contain all 24 choices.");
const occupationIdsWithInterests = new Set((interestMappings ?? []).map((mapping) => mapping.occupation_id));
const interestSlugsWithOccupations = new Set((interestMappings ?? []).map((mapping) => mapping.career_interest_slug));
assert((occupations ?? []).every((occupation) => occupationIdsWithInterests.has(occupation.id)), "An active occupation has no active interest mappings.");
assert((activeInterests ?? []).every((interest) => interestSlugsWithOccupations.has(interest.slug)), "An active interest maps to no active occupation.");
const occupationIdsWithDemoRoles = new Set((rolesWithOccupations ?? []).map((role) => role.occupation_id));
assert((occupations ?? []).every((occupation) => occupationIdsWithDemoRoles.has(occupation.id)), "An active occupation has no active demo role.");
assert((demoRoles ?? []).every((role) => role.occupation_id !== null), "An active demo role has no occupation.");
assert((ictQualifications ?? []).length === ictQualificationSlugs.length, "The ICT qualification taxonomy is incomplete.");
assert((energyQualifications ?? []).length === energyQualificationSlugs.length, "The Guyana energy qualification taxonomy is incomplete.");
assert((energyProviders ?? []).length === energyProviderIds.length, "One or more source-verified Guyana training providers are missing.");
assert((programs ?? []).length === demoProgramIds.length, "The expanded catalogue needs all 45 active training pathways.");
const incompleteDemoPrograms = (programs ?? []).filter((program) => illustrativeProgramIds.includes(program.id) && (!program.name || !program.duration_text || !program.description?.includes("Illustrative cost:")));
assert(incompleteDemoPrograms.length === 0, `${incompleteDemoPrograms.length} training pathways are missing illustrative demo details.`);
const incompleteIctPrograms = (programs ?? []).filter((program) => ictProgramIds.includes(program.id) && (!program.name || !program.duration_text || !program.description));
assert(incompleteIctPrograms.length === 0, `${incompleteIctPrograms.length} ICT training pathways are incomplete.`);
const incompleteEnergyPrograms = (programs ?? []).filter((program) => energyProgramIds.includes(program.id) && (
  !program.name || !program.duration_text || !program.description || !program.enrollment_url ||
  !program.intake_text || program.fee_amount !== null || program.next_intake_date !== null
));
assert(incompleteEnergyPrograms.length === 0, `${incompleteEnergyPrograms.length} Guyana energy training pathways are incomplete or contain unpublished intake/fee claims.`);
assert((employmentActions ?? []).length >= 18, "The individual employment notice route is missing from one or more occupations.");
assert((registrationActions ?? []).length >= 18, "The new Local Content Portal registration route is missing from one or more occupations.");
const matchedRoleIds = new Set((matches ?? []).map((match) => match.job_role_id));
const unmatchedDemoRoles = (demoRoles ?? []).filter((role) => !matchedRoleIds.has(role.id));
assert(unmatchedDemoRoles.length === 0, `Fallback applicant is missing ${unmatchedDemoRoles.length} curated role matches.`);
const ictMatchScores = new Map((matches ?? []).filter((match) => ictRoleIds.includes(match.job_role_id)).map((match) => [match.job_role_id, match.score]));
assert((ictMatchScores.get(ictRoleIds[1]) ?? 0) > 0, "The fallback applicant should match the network and server role.");
assert((ictMatchScores.get(ictRoleIds[4]) ?? 0) > 0, "The fallback applicant should match the database and data role.");
const topThreeRoleIds = [...(matches ?? [])].sort((first, second) => second.score - first.score).slice(0, 3).map((match) => match.job_role_id);
assert(topThreeRoleIds.includes(ictRoleIds[1]), "The network and server role should appear in the fallback applicant's top three.");
assert(topThreeRoleIds.includes(ictRoleIds[4]), "The database and data role should appear in the fallback applicant's top three.");
assert((matches ?? []).some((match) => match.interview_eligible), "Fallback applicant needs one eligible match.");
assert((invitations ?? []).length >= 1, "Fallback applicant needs a pending interview invitation.");

const verifiedProviderIds = new Set((providers ?? []).map((provider) => provider.id));
const visibleProgramIds = (programs ?? [])
  .filter((program) => verifiedProviderIds.has(program.provider_id))
  .map((program) => program.id);
assert(visibleProgramIds.length > 0, "No active program belongs to a verified provider.");

const [{ data: requirements, error: requirementsError }, { data: outcomes, error: outcomesError }] = await Promise.all([
  admin.from("job_requirements").select("qualification_id").in("job_role_id", (demoRoles ?? []).map((role) => role.id)),
  admin.from("training_program_outcomes").select("qualification_id").in("training_program_id", visibleProgramIds),
]);
if (requirementsError || outcomesError) throw new Error("Could not verify training coverage for the curated roles.");

const coveredQualificationIds = new Set((outcomes ?? []).map((outcome) => outcome.qualification_id));
const uncoveredQualificationIds = [...new Set((requirements ?? []).map((requirement) => requirement.qualification_id))]
  .filter((qualificationId) => !coveredQualificationIds.has(qualificationId));
assert(uncoveredQualificationIds.length === 0, `Training coverage is missing for ${uncoveredQualificationIds.length} curated requirements.`);

const processorUrl = process.env.PROCESSOR_URL?.replace(/\/$/, "");
if (processorUrl) {
  const response = await fetch(`${processorUrl}/healthz`, { signal: AbortSignal.timeout(10_000) });
  assert(response.ok, "Thunder processor health check failed.");
}

console.log(`Demo readiness passed: five logins, ${demoRoles?.length ?? 0} curated roles, complete training coverage, and an eligible interview invitation.`);
