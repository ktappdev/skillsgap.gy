"use server";

import { revalidatePath } from "next/cache";

import { requireApplicant, requireApprovedCompanyMember, requirePlatformAdmin } from "@/lib/auth/queries";
import { getDatabaseErrorMessage } from "@/lib/errors";
import { parseGuyanaDateTime } from "@/lib/guyana-time";
import { getTrimmedFormString } from "@/lib/validation";
import type { CareerActionType } from "@/lib/i-want-to-become/guidance";
import { DEFAULT_ELIGIBILITY_THRESHOLD } from "@/lib/skillsgap/constants";
import { validateJobRequirementInput, validateJobRoleDetails, type JobRoleDetailsInput } from "@/lib/skillsgap/job-role";
import { createAdminClient } from "@/lib/supabase/admin";
import type { QualificationReviewDecision, RequirementKind, Tables } from "@/lib/supabase/database.types";

const maxResumeBytes = 15 * 1024 * 1024;

export type QueueResumeResult = { error?: string; resumeId?: string };
export type ClearApplicantPathwayResult = { error?: string };
export type MatchScoreGain = { roleId: string; roleTitle: string; points: number };
export type QualificationSearchEntry = Pick<Tables<"qualifications">, "id" | "name" | "category" | "description" | "slug"> & { matching_aliases: string[]; total_count: number };
export type QualificationRequestInput = { requestId: string | null; roleId: string; name: string; category: RequirementKind; explanation: string; weight: number; minimumYears: number | null; mandatory: boolean };

export async function clearApplicantPathway(): Promise<ClearApplicantPathwayResult> {
  const { user } = await requireApplicant();

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    return { error: "We could not clear your pathway. Please try again." };
  }

  const { data: existingResumes, error: resumeLookupError } = await adminClient
    .from("resumes")
    .select("storage_path")
    .eq("applicant_id", user.id);
  if (resumeLookupError) return { error: getDatabaseErrorMessage(resumeLookupError, "We could not clear your pathway. Please try again.") };

  const existingPaths = (existingResumes ?? []).map((resume) => resume.storage_path);
  if (existingPaths.length > 0) {
    const { error: storageError } = await adminClient.storage.from("resumes").remove(existingPaths);
    if (storageError) return { error: "We could not remove your uploaded CV file. Your pathway is still intact; please try again." };
  }

  const { data: storagePaths, error } = await adminClient.rpc("clear_applicant_pathway", {
    target_applicant_id: user.id,
  });
  if (error) return { error: getDatabaseErrorMessage(error, "We could not clear your pathway. Please try again.") };

  // The RPC returns its paths too, covering a concurrent upload between the
  // lookup above and the database reset.
  const paths = [...new Set(storagePaths ?? [])].filter((path) => !existingPaths.includes(path));
  if (paths.length > 0) {
    const { error: storageError } = await adminClient.storage.from("resumes").remove(paths);
    if (storageError) return { error: "Your pathway was cleared, but we could not remove a CV file. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/interviews");
  revalidatePath("/matches/[matchId]", "page");

  return {};
}

export async function queueResumeProcessing(
  storagePath: string,
  originalFilename: string,
  byteSize: number,
): Promise<QueueResumeResult> {
  const { supabase, user } = await requireApplicant();
  const cleanPath = storagePath.trim();
  const cleanFilename = originalFilename.trim();

  if (!cleanPath.startsWith(`${user.id}/`) || cleanPath.includes("..")) {
    return { error: "That CV path is not valid for your account." };
  }
  if (!cleanFilename.toLowerCase().endsWith(".pdf") || byteSize <= 0 || byteSize > maxResumeBytes) {
    return { error: "Choose a PDF CV up to 15 MB." };
  }

  const { data: existingResume, error: existingResumeError } = await supabase
    .from("resumes")
    .select("id")
    .eq("applicant_id", user.id)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  if (existingResumeError) {
    await supabase.storage.from("resumes").remove([cleanPath]);
    return { error: getDatabaseErrorMessage(existingResumeError, "We could not verify your existing CV.") };
  }
  if (existingResume) {
    await supabase.storage.from("resumes").remove([cleanPath]);
    return { error: "Clear your previous CV before uploading a replacement." };
  }

  const { data: resume, error: resumeError } = await supabase
    .from("resumes")
    .insert({
      applicant_id: user.id,
      storage_path: cleanPath,
      original_filename: cleanFilename,
      mime_type: "application/pdf",
      byte_size: byteSize,
      status: "uploaded",
    })
    .select("id")
    .single();

  if (resumeError || !resume) {
    await supabase.storage.from("resumes").remove([cleanPath]);
    if (resumeError?.code === "23505") {
      return { error: "Clear your previous CV before uploading a replacement." };
    }
    return { error: getDatabaseErrorMessage(resumeError, "We could not save your private CV.") };
  }

  const { error: jobError } = await supabase.from("processing_jobs").insert({
    applicant_id: user.id,
    resume_id: resume.id,
    kind: "resume_analysis",
    status: "queued",
    attempts: 0,
  });

  if (jobError) {
    await supabase.from("resumes").delete().eq("id", resume.id).eq("applicant_id", user.id);
    await supabase.storage.from("resumes").remove([cleanPath]);
    return { error: getDatabaseErrorMessage(jobError, "We could not start CV processing.") };
  }

  await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id);
  revalidatePath("/dashboard");
  return { resumeId: resume.id };
}

export async function applyToJob(roleId: string): Promise<{ error?: string; message?: string }> {
  const { supabase, user } = await requireApplicant();
  const cleanRoleId = roleId.trim();
  if (!cleanRoleId) return { error: "Choose an opportunity before applying." };

  const { data: role, error: roleError } = await supabase
    .from("job_roles")
    .select("id,company_id,status,eligibility_threshold")
    .eq("id", cleanRoleId)
    .eq("status", "active")
    .maybeSingle();
  if (roleError || !role) return { error: "That opportunity is no longer active." };

  const { data: match, error: matchError } = await supabase
    .from("job_matches")
    .select("score,status")
    .eq("applicant_id", user.id)
    .eq("job_role_id", role.id)
    .eq("status", "current")
    .maybeSingle();
  if (matchError) return { error: getDatabaseErrorMessage(matchError, "We could not verify your match.") };
  if (!match || match.score < role.eligibility_threshold) return { error: `Reach a ${role.eligibility_threshold}% match before applying to this role.` };

  const { data: existingApplication, error: existingApplicationError } = await supabase
    .from("job_applications")
    .select("id,status")
    .eq("applicant_id", user.id)
    .eq("job_role_id", role.id)
    .maybeSingle();
  if (existingApplicationError) return { error: getDatabaseErrorMessage(existingApplicationError, "We could not check your application status.") };
  if (existingApplication?.status === "applied") return { message: "You have already applied to this role." };

  if (existingApplication?.status === "withdrawn") {
    const { error } = await supabase
      .from("job_applications")
      .update({ status: "applied" })
      .eq("id", existingApplication.id)
      .eq("applicant_id", user.id)
      .eq("status", "withdrawn");
    if (error) return { error: getDatabaseErrorMessage(error, "We could not submit your application.") };
  } else {
    const { error } = await supabase.from("job_applications").insert({
      applicant_id: user.id,
      job_role_id: role.id,
      company_id: role.company_id,
      status: "applied",
    });
    if (error && error.code !== "23505") return { error: getDatabaseErrorMessage(error, "We could not submit your application.") };
  }

  revalidatePath("/dashboard");
  revalidatePath("/matches/[matchId]", "page");
  revalidatePath("/company/candidates");
  return { message: "Application submitted. The company can now see your interest without seeing your private profile." };
}

export async function withdrawApplication(roleId: string): Promise<{ error?: string; message?: string }> {
  const { supabase, user } = await requireApplicant();
  const cleanRoleId = roleId.trim();
  if (!cleanRoleId) return { error: "Choose an opportunity before withdrawing." };

  const { data, error } = await supabase
    .from("job_applications")
    .update({ status: "withdrawn" })
    .eq("applicant_id", user.id)
    .eq("job_role_id", cleanRoleId)
    .eq("status", "applied")
    .select("id")
    .maybeSingle();
  if (error) return { error: getDatabaseErrorMessage(error, "We could not withdraw your application.") };
  if (!data) return { error: "You do not have an active application for this role." };

  revalidatePath("/dashboard");
  revalidatePath("/matches/[matchId]", "page");
  revalidatePath("/company/candidates");
  return { message: "Your application was withdrawn. Any interview invitation remains separate." };
}

export async function bookInterviewSlot(invitationId: string, interviewSlotId: string): Promise<{ error?: string; message?: string }> {
  const { supabase, user } = await requireApplicant();
  const { error } = await supabase.from("interview_bookings").insert({
    invitation_id: invitationId,
    interview_slot_id: interviewSlotId,
    applicant_id: user.id,
    status: "confirmed",
  });
  if (error) {
    return { error: error.code === "23505" ? "That time was just taken. Choose another slot." : getDatabaseErrorMessage(error, "We could not reserve that interview time.") };
  }
  revalidatePath("/interviews");
  return { message: "Interview slot confirmed." };
}

export async function confirmApplicantQualification(qualificationId: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireApplicant();
  const { error: updateError } = await supabase.from("applicant_qualifications").update({ source: "applicant_confirmed", review_status: "confirmed" }).eq("applicant_id", user.id).eq("qualification_id", qualificationId);
  if (updateError) return { error: getDatabaseErrorMessage(updateError, "We could not confirm that qualification.") };
  revalidatePath("/dashboard");
  return {};
}

export async function confirmExtractionFindings(
  selections: Array<{ findingId: string; qualificationId: string }>,
): Promise<{ confirmedFindingIds: string[]; error?: string; gains: MatchScoreGain[] }> {
  const { supabase, user } = await requireApplicant();
  if (selections.length === 0) return { confirmedFindingIds: [], error: "Choose at least one skill to confirm.", gains: [] };

  const [qualificationResult, experienceResult, roleResult, companyResult] = await Promise.all([
    supabase.from("applicant_qualifications").select("qualification_id,years_experience").eq("applicant_id", user.id).eq("review_status", "confirmed"),
    supabase.from("applicant_experience").select("years").eq("applicant_id", user.id),
    supabase.from("job_roles").select("id,title,company_id").eq("status", "active"),
    supabase.from("companies").select("id").eq("status", "approved"),
  ]);
  const approvedCompanyIds = new Set((companyResult.data ?? []).map((company) => company.id));
  const roles = (roleResult.data ?? []).filter((role) => approvedCompanyIds.has(role.company_id));
  const requirementResult = roles.length > 0
    ? await supabase.from("job_requirements").select("job_role_id,qualification_id,kind,minimum_years,weight").in("job_role_id", roles.map((role) => role.id))
    : { data: [], error: null };
  const totalExperienceYears = (experienceResult.data ?? []).reduce((total, item) => total + item.years, 0);
  const confirmedFindingIds: string[] = [];

  for (const selection of selections) {
    const { error } = await supabase.rpc("confirm_extraction_finding", {
      target_finding_id: selection.findingId,
      target_qualification_id: selection.qualificationId,
    });
    if (error) {
      revalidatePath("/dashboard");
      return {
        confirmedFindingIds,
        error: getDatabaseErrorMessage(error, "We could not confirm every selected skill."),
        gains: [],
      };
    }
    confirmedFindingIds.push(selection.findingId);
  }

  const qualificationsAfterResult = await supabase
    .from("applicant_qualifications")
    .select("qualification_id,years_experience")
    .eq("applicant_id", user.id)
    .eq("review_status", "confirmed");
  const scoreForRole = (roleId: string, qualifications: Array<{ qualification_id: string; years_experience: number | null }>) => {
    const roleRequirements = (requirementResult.data ?? []).filter((requirement) => requirement.job_role_id === roleId);
    const totalWeight = roleRequirements.reduce((total, requirement) => total + requirement.weight, 0);
    if (totalWeight === 0) return 0;
    const yearsByQualification = new Map(qualifications.map((qualification) => [qualification.qualification_id, qualification.years_experience ?? 0]));
    const satisfiedWeight = roleRequirements.reduce((total, requirement) => {
      const qualificationYears = yearsByQualification.get(requirement.qualification_id);
      const hasEnoughExperience = requirement.minimum_years === null
        || (qualificationYears !== undefined && qualificationYears >= requirement.minimum_years)
        || (requirement.kind === "experience" && totalExperienceYears >= requirement.minimum_years);
      return qualificationYears !== undefined && hasEnoughExperience ? total + requirement.weight : total;
    }, 0);
    return Math.round((satisfiedWeight * 100) / totalWeight);
  };
  const canCalculateGains = !qualificationResult.error
    && !experienceResult.error
    && !roleResult.error
    && !companyResult.error
    && !requirementResult.error
    && !qualificationsAfterResult.error;
  const gains = canCalculateGains
    ? roles.flatMap((role) => {
      const points = scoreForRole(role.id, qualificationsAfterResult.data ?? []) - scoreForRole(role.id, qualificationResult.data ?? []);
      return points > 0 ? [{ roleId: role.id, roleTitle: role.title, points }] : [];
    }).sort((first, second) => second.points - first.points || first.roleTitle.localeCompare(second.roleTitle))
    : [];

  revalidatePath("/dashboard");
  revalidatePath("/matches/[matchId]", "page");
  return {
    confirmedFindingIds,
    gains,
  };
}

export async function rejectExtractionFindings(findingIds: string[]): Promise<{ rejectedFindingIds: string[]; error?: string }> {
  const { supabase } = await requireApplicant();
  const uniqueFindingIds = [...new Set(findingIds.map((findingId) => findingId.trim()).filter(Boolean))];
  if (uniqueFindingIds.length === 0) return { rejectedFindingIds: [], error: "Choose a suggestion to dismiss." };
  if (uniqueFindingIds.length > 50) return { rejectedFindingIds: [], error: "Choose fewer suggestions to dismiss at once." };

  const rejectedFindingIds: string[] = [];
  for (const findingId of uniqueFindingIds) {
    const { error } = await supabase.rpc("reject_extraction_finding", { target_finding_id: findingId });
    if (error) {
      revalidatePath("/dashboard");
      return {
        rejectedFindingIds,
        error: getDatabaseErrorMessage(error, "We could not remove that finding."),
      };
    }
    rejectedFindingIds.push(findingId);
  }

  revalidatePath("/dashboard");
  return { rejectedFindingIds };
}

export async function updateApplicantQualificationYears(qualificationId: string, yearsValue: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireApplicant();
  const trimmed = yearsValue.trim();
  const years = trimmed === "" ? null : Number(trimmed);
  if (years !== null && (!Number.isFinite(years) || years < 0 || years > 60)) return { error: "Use experience from 0 to 60 years." };
  const { error } = await supabase.from("applicant_qualifications").update({ years_experience: years, source: "applicant_confirmed", review_status: "confirmed" }).eq("applicant_id", user.id).eq("qualification_id", qualificationId);
  if (error) return { error: getDatabaseErrorMessage(error, "We could not update that experience.") };
  revalidatePath("/dashboard");
  return {};
}

export async function correctApplicantQualification(qualificationId: string, correctedQualificationId: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireApplicant();
  if (!qualificationId || !correctedQualificationId) return { error: "Choose the correct transferable skill." };
  const { error } = await supabase
    .from("applicant_qualifications")
    .update({ qualification_id: correctedQualificationId, source: "applicant_confirmed", review_status: "confirmed" })
    .eq("applicant_id", user.id)
    .eq("qualification_id", qualificationId);
  if (error) return { error: getDatabaseErrorMessage(error, "We could not correct that translation.") };
  revalidatePath("/dashboard");
  return {};
}

export async function updateApplicantExperience(
  experienceId: string,
  title: string,
  employer: string,
  yearsValue: string,
): Promise<{ error?: string }> {
  const { supabase, user } = await requireApplicant();
  const cleanTitle = title.trim();
  const cleanEmployer = employer.trim();
  const trimmedYears = yearsValue.trim();
  const years = trimmedYears === "" ? null : Number(trimmedYears);

  if (cleanTitle.length < 1 || cleanTitle.length > 160) {
    return { error: "Add a work title between 1 and 160 characters." };
  }
  if (cleanEmployer.length > 160) {
    return { error: "Employer names must be 160 characters or fewer." };
  }
  if (years === null || !Number.isFinite(years) || years < 0 || years > 60) {
    return { error: "Use experience from 0 to 60 years." };
  }

  const { error } = await supabase
    .from("applicant_experience")
    .update({ title: cleanTitle, employer: cleanEmployer || null, years })
    .eq("id", experienceId)
    .eq("applicant_id", user.id);
  if (error) return { error: getDatabaseErrorMessage(error, "We could not update that work history.") };
  revalidatePath("/dashboard");
  return {};
}

export async function startTrainingPlan(gapId: string): Promise<{ error?: string }> {
  const { supabase } = await requireApplicant();
  const { error } = await supabase.from("match_gaps").update({ status: "plan_started" }).eq("id", gapId);
  if (error) return { error: getDatabaseErrorMessage(error, "We could not start that training plan.") };
  revalidatePath("/dashboard");
  revalidatePath("/matches/[matchId]", "page");
  return {};
}

export async function addApplicantQualification(qualificationId: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireApplicant();
  const { error } = await supabase.from("applicant_qualifications").insert({ applicant_id: user.id, qualification_id: qualificationId, source: "applicant_confirmed", review_status: "confirmed" });
  if (error && error.code !== "23505") return { error: getDatabaseErrorMessage(error, "We could not add that qualification.") };
  revalidatePath("/dashboard");
  return {};
}

export async function removeApplicantQualification(qualificationId: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireApplicant();
  const { error } = await supabase.from("applicant_qualifications").delete().eq("applicant_id", user.id).eq("qualification_id", qualificationId);
  if (error) return { error: getDatabaseErrorMessage(error, "We could not remove that qualification.") };
  revalidatePath("/dashboard");
  return {};
}


export async function reviewCompany(companyId: string, status: "approved" | "rejected"): Promise<{ error?: string }> {
  const { supabase, user } = await requirePlatformAdmin();
  const { error } = await supabase.from("companies").update({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", companyId);
  if (error) return { error: getDatabaseErrorMessage(error, "Only a platform administrator can review companies.") };
  revalidatePath("/admin/companies");
  return {};
}

export async function createJobRole(input: JobRoleDetailsInput): Promise<{ error?: string; role?: Tables<"job_roles"> }> {
  const { supabase, user, companyId } = await requireApprovedCompanyMember();
  const check = validateJobRoleDetails(input);
  if (check.error || !check.values) return { error: check.error ?? "Check the role details and try again." };
  if (check.values.occupationId) {
    const { data: occupation, error: occupationError } = await supabase.from("occupations").select("id").eq("id", check.values.occupationId).eq("is_active", true).maybeSingle();
    if (occupationError || !occupation) return { error: "Choose an active occupation mapping." };
  }
  const { data, error } = await supabase.from("job_roles").insert({
    company_id: companyId,
    title: check.values.title,
    created_by: user.id,
    eligibility_threshold: check.values.eligibilityThreshold ?? DEFAULT_ELIGIBILITY_THRESHOLD,
    description: check.values.description,
    location: check.values.location,
    employment_type: check.values.employmentType || null,
    occupation_id: check.values.occupationId,
    status: "draft",
  }).select("*").single();
  if (error) return { error: getDatabaseErrorMessage(error, "We could not create that role.") };
  revalidatePath("/company/jobs");
  return { role: data };
}

export async function updateJobRole(roleId: string, input: JobRoleDetailsInput): Promise<{ error?: string; role?: Tables<"job_roles"> }> {
  const { supabase, companyId } = await requireApprovedCompanyMember();
  const check = validateJobRoleDetails(input);
  if (check.error || !check.values) return { error: check.error ?? "Check the role details and try again." };
  const { data: role, error: roleError } = await supabase.from("job_roles").select("id").eq("id", roleId).eq("company_id", companyId).maybeSingle();
  if (roleError || !role) return { error: "That role is not part of your company workspace." };
  if (check.values.occupationId) {
    const { data: occupation, error: occupationError } = await supabase.from("occupations").select("id").eq("id", check.values.occupationId).eq("is_active", true).maybeSingle();
    if (occupationError || !occupation) return { error: "Choose an active occupation mapping." };
  }
  const { data, error } = await supabase.from("job_roles").update({
    title: check.values.title,
    description: check.values.description,
    location: check.values.location,
    employment_type: check.values.employmentType || null,
    eligibility_threshold: check.values.eligibilityThreshold ?? DEFAULT_ELIGIBILITY_THRESHOLD,
    occupation_id: check.values.occupationId,
  }).eq("id", roleId).eq("company_id", companyId).select("*").single();
  if (error) return { error: getDatabaseErrorMessage(error, "We could not update that role.") };
  revalidatePath("/company/jobs");
  revalidatePath(`/opportunities/${roleId}`);
  return { role: data };
}

export async function setJobRoleStatus(roleId: string, status: "draft" | "active" | "archived"): Promise<{ error?: string }> {
  const { supabase, companyId } = await requireApprovedCompanyMember();
  const { data: role, error: roleError } = await supabase.from("job_roles").select("id").eq("id", roleId).eq("company_id", companyId).maybeSingle();
  if (roleError || !role) return { error: "That role is not part of your company workspace." };
  if (status === "active") {
    const { count, error: requirementError } = await supabase.from("job_requirements").select("id", { count: "exact", head: true }).eq("job_role_id", roleId);
    if (requirementError) return { error: getDatabaseErrorMessage(requirementError, "We could not verify the role requirements.") };
    if (!count) return { error: "Add at least one requirement before publishing this role." };
  }
  const values = status === "active" ? { status, published_at: new Date().toISOString() } : { status };
  const { error } = await supabase.from("job_roles").update(values).eq("id", roleId).eq("company_id", companyId);
  if (error) {
    if (error.code === "23514" && error.message.includes("pending qualification request")) {
      return { error: "Resolve or remove every pending qualification request before publishing this role." };
    }
    return { error: getDatabaseErrorMessage(error, "We could not update that role.") };
  }
  revalidatePath("/company/jobs");
  return {};
}

export async function searchQualifications(search: string, page: number, excludedQualificationIds: string[]): Promise<{ error?: string; results: QualificationSearchEntry[]; totalCount: number }> {
  const { supabase } = await requireApprovedCompanyMember();
  const cleanSearch = search.trim();
  if (cleanSearch.length < 2) return { results: [], totalCount: 0 };
  if (!Number.isInteger(page) || page < 1 || page > 50000) return { error: "Choose a valid search page.", results: [], totalCount: 0 };
  const { data, error } = await supabase.rpc("search_active_qualifications", {
    p_search: cleanSearch,
    p_excluded_qualification_ids: excludedQualificationIds,
    p_page: page,
  });
  if (error) return { error: getDatabaseErrorMessage(error, "We could not search the qualification catalogue."), results: [], totalCount: 0 };
  return { results: data ?? [], totalCount: data?.[0]?.total_count ?? 0 };
}

export async function saveQualificationRequest(input: QualificationRequestInput): Promise<{ error?: string; request?: Tables<"qualification_requests"> }> {
  const { supabase } = await requireApprovedCompanyMember();
  const name = input.name.trim();
  const explanation = input.explanation.trim();
  const allowedCategories: RequirementKind[] = ["technical_skill", "certification", "compliance", "experience", "education"];
  if (name.length < 2 || name.length > 160 || explanation.length < 10 || explanation.length > 2000 || !allowedCategories.includes(input.category)) {
    return { error: "Add a qualification name, category, and explanation of at least 10 characters." };
  }
  const inputError = validateJobRequirementInput(input.weight, input.mandatory, input.minimumYears);
  if (inputError) return { error: inputError };
  const { data: requestId, error } = await supabase.rpc("save_qualification_request", {
    target_request_id: input.requestId,
    target_role_id: input.roleId,
    proposed_name: name,
    target_category: input.category,
    explanation,
    requirement_weight: input.weight,
    target_minimum_years: input.minimumYears,
    target_mandatory: input.mandatory,
  });
  if (error || !requestId) return { error: getDatabaseErrorMessage(error, "We could not save that qualification request.") };
  const { data: request, error: readError } = await supabase.from("qualification_requests").select("*").eq("id", requestId).single();
  if (readError || !request) return { error: getDatabaseErrorMessage(readError, "The request was saved, but we could not refresh its status.") };
  revalidatePath("/company/jobs");
  revalidatePath("/admin/qualifications");
  return { request };
}

export async function withdrawQualificationRequest(requestId: string): Promise<{ error?: string }> {
  const { supabase } = await requireApprovedCompanyMember();
  if (!requestId) return { error: "Choose a qualification request to remove." };
  const { error } = await supabase.rpc("withdraw_qualification_request", { target_request_id: requestId });
  if (error) return { error: getDatabaseErrorMessage(error, "We could not remove that qualification request.") };
  revalidatePath("/company/jobs");
  revalidatePath("/admin/qualifications");
  return {};
}

export async function reviewQualificationSubmission(formData: FormData): Promise<{ error?: string; message?: string }> {
  const { supabase } = await requirePlatformAdmin();
  const source = getTrimmedFormString(formData, "source");
  const submissionId = getTrimmedFormString(formData, "submissionId");
  const decision = getTrimmedFormString(formData, "decision") as QualificationReviewDecision;
  const name = getTrimmedFormString(formData, "name");
  const suppliedSlug = getTrimmedFormString(formData, "slug");
  const slug = suppliedSlug || slugifyQualification(name);
  const category = getTrimmedFormString(formData, "category") as RequirementKind;
  const description = getTrimmedFormString(formData, "description");
  const alias = getTrimmedFormString(formData, "alias");
  const reason = getTrimmedFormString(formData, "reason");
  const targetQualificationId = getTrimmedFormString(formData, "targetQualificationId");
  const requirementCategory = getTrimmedFormString(formData, "requirementCategory") as RequirementKind;
  const weightText = getTrimmedFormString(formData, "weight");
  const minimumYearsText = getTrimmedFormString(formData, "minimumYears");
  const mandatoryText = getTrimmedFormString(formData, "mandatory");
  const requirementSettingsConfirmed = getTrimmedFormString(formData, "requirementSettingsConfirmed") === "true";
  const allowedCategories: RequirementKind[] = ["technical_skill", "certification", "compliance", "experience", "education"];
  if ((source !== "employer" && source !== "provider") || !submissionId || !["existing", "existing_with_alias", "new", "decline"].includes(decision)) {
    return { error: "Choose a valid qualification submission and review decision." };
  }
  if (decision !== "decline" && decision !== "new" && !targetQualificationId) return { error: "Choose the approved qualification to use." };
  if (decision === "new" && (!allowedCategories.includes(category) || name.trim().length < 2 || description.trim().length < 10 || description.length > 500 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))) {
    return { error: "A new qualification needs a name, valid slug, category, and description between 10 and 500 characters." };
  }
  if (decision === "decline" && reason.trim().length < 3) return { error: "Add a reason before declining this submission." };
  const weight = Number(weightText);
  const minimumYears = minimumYearsText === "" ? null : Number(minimumYearsText);
  const mandatory = mandatoryText === "true";
  if (source === "employer" && decision !== "decline") {
    if (!allowedCategories.includes(requirementCategory) || !Number.isInteger(weight) || mandatoryText !== "true" && mandatoryText !== "false") {
      return { error: "Choose final requirement settings before approving this employer request." };
    }
    const inputError = validateJobRequirementInput(weight, mandatory, minimumYears);
    if (inputError) return { error: inputError };
    if (!requirementSettingsConfirmed) return { error: "Confirm the final requirement settings before approving this employer request." };
  }
  const { error } = await supabase.rpc("review_qualification_submission", {
    submission_source: source,
    submission_id: submissionId,
    decision,
    target_qualification_id: targetQualificationId || null,
    new_name: name || null,
    new_slug: slug || null,
    new_category: category || null,
    new_description: description || null,
    target_alias: alias || null,
    requirement_category: source === "employer" && decision !== "decline" ? requirementCategory : null,
    requirement_weight: source === "employer" && decision !== "decline" ? weight : null,
    requirement_minimum_years: source === "employer" && decision !== "decline" ? minimumYears : null,
    requirement_mandatory: source === "employer" && decision !== "decline" ? mandatory : null,
    reviewer_reason: reason || null,
    requirement_settings_confirmed: requirementSettingsConfirmed,
  });
  if (error) return { error: getDatabaseErrorMessage(error, "We could not review that qualification submission.") };
  revalidatePath("/admin/qualifications");
  revalidatePath("/company/jobs");
  revalidatePath("/provider/programs");
  revalidatePath("/training");
  revalidatePath("/dashboard");
  revalidatePath("/matches/[matchId]", "page");
  return { message: decision === "decline" ? "Qualification submission declined." : "Qualification submission approved and linked." };
}

function slugifyQualification(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function addJobRequirement(
  roleId: string,
  qualificationId: string,
  kind: Tables<"job_requirements">["kind"],
  weight: number,
  mandatory: boolean,
  minimumYears: number | null,
): Promise<{ error?: string; requirement?: Tables<"job_requirements"> }> {
  const { supabase, companyId } = await requireApprovedCompanyMember();
  const allowedKinds: Tables<"job_requirements">["kind"][] = ["technical_skill", "certification", "compliance", "experience", "education"];
  if (!allowedKinds.includes(kind)) return { error: "Choose a valid requirement type." };
  const inputError = validateJobRequirementInput(weight, mandatory, minimumYears);
  if (inputError) return { error: inputError };
  const { data: role, error: roleError } = await supabase.from("job_roles").select("id").eq("id", roleId).eq("company_id", companyId).maybeSingle();
  if (roleError || !role) return { error: "That role is not part of your company workspace." };
  const { data: qualification, error: qualificationError } = await supabase.from("qualifications").select("id").eq("id", qualificationId).eq("is_active", true).maybeSingle();
  if (qualificationError || !qualification) return { error: "Choose an active qualification from the list." };
  const { data, error } = await supabase.from("job_requirements").insert({ job_role_id: roleId, qualification_id: qualificationId, kind, weight, mandatory, minimum_years: minimumYears }).select("*").single();
  if (error) return { error: getDatabaseErrorMessage(error, "We could not add that requirement.") };
  revalidatePath("/company/jobs");
  return { requirement: data };
}

export async function updateJobRequirement(
  requirementId: string,
  roleId: string,
  kind: Tables<"job_requirements">["kind"],
  weight: number,
  mandatory: boolean,
  minimumYears: number | null,
): Promise<{ error?: string; requirement?: Tables<"job_requirements"> }> {
  const { supabase, companyId } = await requireApprovedCompanyMember();
  const allowedKinds: Tables<"job_requirements">["kind"][] = ["technical_skill", "certification", "compliance", "experience", "education"];
  if (!allowedKinds.includes(kind)) return { error: "Choose a valid requirement type." };
  const inputError = validateJobRequirementInput(weight, mandatory, minimumYears);
  if (inputError) return { error: inputError };
  const { data: role, error: roleError } = await supabase.from("job_roles").select("id").eq("id", roleId).eq("company_id", companyId).maybeSingle();
  if (roleError || !role) return { error: "That role is not part of your company workspace." };
  const { data, error } = await supabase.from("job_requirements").update({ kind, weight, mandatory, minimum_years: minimumYears }).eq("id", requirementId).eq("job_role_id", roleId).select("*").single();
  if (error) return { error: getDatabaseErrorMessage(error, "We could not update that requirement.") };
  revalidatePath("/company/jobs");
  return { requirement: data };
}

export async function removeJobRequirement(requirementId: string, roleId: string): Promise<{ error?: string }> {
  const { supabase, companyId } = await requireApprovedCompanyMember();
  const { data: role, error: roleError } = await supabase.from("job_roles").select("id").eq("id", roleId).eq("company_id", companyId).maybeSingle();
  if (roleError || !role) return { error: "That role is not part of your company workspace." };
  const { error } = await supabase.from("job_requirements").delete().eq("id", requirementId).eq("job_role_id", roleId);
  if (error) return { error: getDatabaseErrorMessage(error, "We could not remove that requirement.") };
  revalidatePath("/company/jobs");
  return {};
}

export async function createJobFair(name: string, location: string, startsAt: string, endsAt: string): Promise<{ error?: string; fair?: Tables<"job_fairs"> }> {
  const { supabase, companyId } = await requireApprovedCompanyMember();
  const start = parseGuyanaDateTime(startsAt);
  const end = parseGuyanaDateTime(endsAt);
  if (!name.trim() || name.trim().length > 160 || !location.trim() || !start || !end || end <= start || start <= new Date()) return { error: "Add a name, location, and future Guyana time range." };
  const { data, error } = await supabase.from("job_fairs").insert({ company_id: companyId, name: name.trim(), location: location.trim(), starts_at: start.toISOString(), ends_at: end.toISOString(), status: "draft" }).select("*").single();
  if (error) return { error: getDatabaseErrorMessage(error, "We could not create that job fair.") };
  revalidatePath("/company/job-fairs");
  return { fair: data };
}

export async function addInterviewSlot(fairId: string, startsAt: string): Promise<{ error?: string; slot?: Tables<"interview_slots"> }> {
  const { supabase } = await requireApprovedCompanyMember();
  const start = parseGuyanaDateTime(startsAt);
  if (!start) return { error: "Choose a valid future Guyana slot time." };
  const end = new Date(start.getTime() + 15 * 60 * 1000);
  if (start <= new Date()) return { error: "Choose a future Guyana slot time." };
  const { data: fair, error: fairError } = await supabase.from("job_fairs").select("starts_at,ends_at").eq("id", fairId).maybeSingle();
  if (fairError || !fair || start < new Date(fair.starts_at) || end > new Date(fair.ends_at)) return { error: "The slot must fit inside the job fair time." };
  const { data, error } = await supabase.from("interview_slots").insert({ job_fair_id: fairId, starts_at: start.toISOString(), ends_at: end.toISOString() }).select("*").single();
  if (error) return { error: error.code === "23505" ? "That 15-minute slot already exists." : getDatabaseErrorMessage(error, "We could not add that slot.") };
  revalidatePath("/company/job-fairs");
  return { slot: data };
}

export async function openJobFair(fairId: string, status: "open" | "closed"): Promise<{ error?: string }> {
  const { supabase } = await requireApprovedCompanyMember();
  if (status === "open") {
    const { count, error: slotError } = await supabase.from("interview_slots").select("id", { count: "exact", head: true }).eq("job_fair_id", fairId);
    if (slotError) return { error: getDatabaseErrorMessage(slotError, "We could not verify the interview slots.") };
    if (!count) return { error: "Add at least one 15-minute slot before opening the fair." };
  }
  const { error } = await supabase.from("job_fairs").update({ status }).eq("id", fairId);
  if (error) return { error: getDatabaseErrorMessage(error, "We could not update that job fair.") };
  revalidatePath("/company/job-fairs");
  return {};
}

export async function createQualification(name: string, slug: string, category: RequirementKind, description: string): Promise<{ error?: string; qualification?: Tables<"qualifications"> }> {
  const { supabase } = await requirePlatformAdmin();
  const cleanName = name.trim();
  const cleanSlug = slug.trim().toLowerCase();
  const cleanDescription = description.trim();
  if (cleanName.length < 2 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug) || cleanDescription.length < 10 || cleanDescription.length > 500) {
    return { error: "Add a name, lowercase slug, and description between 10 and 500 characters." };
  }
  const { data: qualificationId, error } = await supabase.rpc("create_admin_qualification", {
    target_name: cleanName,
    target_slug: cleanSlug,
    target_category: category,
    target_description: cleanDescription,
  });
  if (error || !qualificationId) return { error: getDatabaseErrorMessage(error, "We could not create that qualification.") };
  const { data, error: readError } = await supabase.from("qualifications").select("*").eq("id", qualificationId).single();
  if (readError || !data) return { error: getDatabaseErrorMessage(readError, "The qualification was created, but we could not refresh it.") };
  revalidatePath("/admin/qualifications");
  return { qualification: data };
}

export async function updateQualification(
  qualificationId: string,
  name: string,
  category: Tables<"qualifications">["category"],
  description: string,
  isActive: boolean,
): Promise<{ error?: string; qualification?: Tables<"qualifications"> }> {
  const { supabase } = await requirePlatformAdmin();
  const cleanName = name.trim();
  const cleanDescription = description.trim();
  const allowedCategories: Tables<"qualifications">["category"][] = ["technical_skill", "certification", "compliance", "experience", "education"];
  if (!qualificationId || cleanName.length < 2 || cleanName.length > 160 || !allowedCategories.includes(category) || cleanDescription.length > 500) {
    return { error: "Use a valid qualification name, category, and description." };
  }
  const { data: updatedId, error } = await supabase.rpc("update_admin_qualification", {
    target_qualification_id: qualificationId,
    target_name: cleanName,
    target_category: category,
    target_description: cleanDescription,
    target_is_active: isActive,
  });
  if (error || !updatedId) return { error: getDatabaseErrorMessage(error, "We could not update that qualification.") };
  const { data, error: readError } = await supabase.from("qualifications").select("*").eq("id", updatedId).single();
  if (readError || !data) return { error: getDatabaseErrorMessage(readError, "The qualification was updated, but we could not refresh it.") };
  revalidatePath("/admin/qualifications");
  return { qualification: data };
}

export async function createQualificationAlias(qualificationId: string, alias: string): Promise<{ error?: string; alias?: Tables<"qualification_aliases"> }> {
  const { supabase } = await requirePlatformAdmin();
  const cleanAlias = alias.trim();
  if (!qualificationId || cleanAlias.length < 2 || cleanAlias.length > 160) return { error: "Use an alias between 2 and 160 characters." };
  const { data: aliasId, error } = await supabase.rpc("create_admin_qualification_alias", { target_qualification_id: qualificationId, target_alias: cleanAlias });
  if (error || !aliasId) return { error: error?.code === "23505" ? "That wording already identifies a qualification." : getDatabaseErrorMessage(error, "We could not add that alias.") };
  const { data, error: readError } = await supabase.from("qualification_aliases").select("*").eq("id", aliasId).single();
  if (readError || !data) return { error: getDatabaseErrorMessage(readError, "The alias was added, but we could not refresh it.") };
  revalidatePath("/admin/qualifications");
  return { alias: data };
}

export async function createTrainingProvider(name: string, location: string, description: string): Promise<{ error?: string; provider?: Tables<"training_providers"> }> {
  const { supabase } = await requirePlatformAdmin();
  const cleanName = name.trim();
  const cleanLocation = location.trim();
  if (cleanName.length < 2 || cleanName.length > 160 || cleanLocation.length < 2 || cleanLocation.length > 160) return { error: "Add a provider name and location." };
  const { data, error } = await supabase.from("training_providers").insert({ name: cleanName, location: cleanLocation, description: description.trim() || null, is_verified: false }).select("*").single();
  if (error) return { error: error.code === "23505" ? "That provider already exists at this location." : getDatabaseErrorMessage(error, "We could not add that provider.") };
  revalidatePath("/admin/training");
  return { provider: data };
}

export async function createTrainingProgram(providerId: string, name: string, duration: string, enrollmentUrl: string): Promise<{ error?: string; program?: Tables<"training_programs"> }> {
  const { supabase } = await requirePlatformAdmin();
  const cleanName = name.trim();
  if (!providerId || cleanName.length < 2 || cleanName.length > 160) return { error: "Choose a provider and add a program name." };
  const { data, error } = await supabase.from("training_programs").insert({ provider_id: providerId, name: cleanName, duration_text: duration.trim() || null, enrollment_url: enrollmentUrl.trim() || null, description: null, is_active: true }).select("*").single();
  if (error) return { error: error.code === "23505" ? "That program already exists for this provider." : getDatabaseErrorMessage(error, "We could not add that program.") };
  revalidatePath("/admin/training");
  return { program: data };
}

export async function mapTrainingOutcome(programId: string, qualificationId: string): Promise<{ error?: string }> {
  const { supabase } = await requirePlatformAdmin();
  if (!programId || !qualificationId) return { error: "Choose a program and qualification." };
  const { error } = await supabase.from("training_program_outcomes").insert({ training_program_id: programId, qualification_id: qualificationId });
  if (error && error.code !== "23505") return { error: getDatabaseErrorMessage(error, "We could not map that outcome.") };
  revalidatePath("/admin/training");
  return {};
}

export async function reviewTrainingProvider(formData: FormData): Promise<{ error?: string; message?: string }> {
  const { supabase } = await requirePlatformAdmin();
  const providerId = getTrimmedFormString(formData, "providerId");
  const decision = getTrimmedFormString(formData, "decision");
  const reviewerNotes = getTrimmedFormString(formData, "reviewNotes");
  if (!providerId || (decision !== "approve" && decision !== "needs_changes")) {
    return { error: "Choose a provider and review decision." };
  }
  if (reviewerNotes.length > 2000) return { error: "Review notes must be 2000 characters or fewer." };

  const { error } = await supabase.rpc("review_training_provider", {
    target_provider_id: providerId,
    approve: decision === "approve",
    reviewer_notes: reviewerNotes || null,
  });
  if (error) return { error: getDatabaseErrorMessage(error, "We could not update provider verification.") };

  revalidatePath("/provider");
  revalidatePath("/admin/training");
  revalidatePath("/training");
  revalidatePath(`/training/providers/${providerId}`);
  return { message: decision === "approve" ? "Provider approved." : "Verification changes requested; public visibility has been removed." };
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function cleanGuidanceText(value: string, minimum: number, maximum: number) {
  const cleaned = value.trim();
  return cleaned.length >= minimum && cleaned.length <= maximum ? cleaned : null;
}

export async function updateOccupationTransferSummary(occupationId: string, summary: string): Promise<{ error?: string }> {
  const { supabase } = await requirePlatformAdmin();
  const cleanSummary = cleanGuidanceText(summary, 40, 700);
  if (!occupationId || !cleanSummary) return { error: "Use a transfer summary between 40 and 700 characters." };
  const { error } = await supabase.from("occupations").update({ industry_transfer_summary: cleanSummary }).eq("id", occupationId);
  if (error) return { error: getDatabaseErrorMessage(error, "We could not update that transfer summary.") };
  revalidatePath("/admin/career-guidance");
  revalidatePath("/i-want-to-become");
  return {};
}

export async function createCareerPreparationSubject(
  occupationId: string,
  subjectName: string,
  guidanceNote: string,
  sourceUrl: string,
  sourceLocator: string,
): Promise<{ error?: string; subject?: Tables<"career_preparation_subjects"> }> {
  const { supabase } = await requirePlatformAdmin();
  const cleanSubject = cleanGuidanceText(subjectName, 2, 120);
  const cleanNote = cleanGuidanceText(guidanceNote, 10, 500);
  const cleanSourceUrl = sourceUrl.trim();
  const cleanLocator = cleanGuidanceText(sourceLocator, 2, 180);
  if (!occupationId || !cleanSubject || !cleanNote || !cleanLocator || !isHttpsUrl(cleanSourceUrl)) return { error: "Add a subject, guidance note, HTTPS source, and source location." };
  const { data, error } = await supabase.from("career_preparation_subjects").insert({ occupation_id: occupationId, subject_name: cleanSubject, guidance_note: cleanNote, source_url: cleanSourceUrl, source_locator: cleanLocator, last_verified_at: new Date().toISOString().slice(0, 10), is_active: true }).select("*").single();
  if (error) return { error: error.code === "23505" ? "That preparation subject is already mapped." : getDatabaseErrorMessage(error, "We could not add that preparation subject.") };
  revalidatePath("/admin/career-guidance");
  revalidatePath("/i-want-to-become");
  return { subject: data };
}

export type OccupationPathwayActionInput = {
  occupationId: string;
  actionType: CareerActionType;
  title: string;
  instruction: string;
  whyItHelps: string;
  organizationName: string;
  location: string;
  url: string;
  sourceUrl: string;
  sourceLocator: string;
  sortOrder: number;
  trainingProgramId?: string | null;
};

function isCareerActionType(value: string): value is CareerActionType {
  return value === "learn" || value === "practice" || value === "register" || value === "find_work" || value === "guidance";
}

function validateOccupationPathwayAction(input: OccupationPathwayActionInput) {
  const title = cleanGuidanceText(input.title, 2, 180);
  const instruction = cleanGuidanceText(input.instruction, 10, 700);
  const whyItHelps = cleanGuidanceText(input.whyItHelps, 10, 500);
  const organizationName = cleanGuidanceText(input.organizationName, 2, 180);
  const location = input.location.trim();
  const url = input.url.trim();
  const sourceUrl = input.sourceUrl.trim();
  const sourceLocator = cleanGuidanceText(input.sourceLocator, 2, 180);
  if (!input.occupationId || !isCareerActionType(input.actionType) || !title || !instruction || !whyItHelps || !organizationName || location.length > 180 || !sourceLocator || !isHttpsUrl(url) || !isHttpsUrl(sourceUrl) || !Number.isInteger(input.sortOrder) || input.sortOrder < 1 || input.sortOrder > 20) return null;
  return { title, instruction, whyItHelps, organizationName, location: location || null, url, sourceUrl, sourceLocator, sortOrder: input.sortOrder, trainingProgramId: input.trainingProgramId || null };
}

export async function createOccupationPathwayAction(input: OccupationPathwayActionInput): Promise<{ error?: string; action?: Tables<"occupation_pathway_actions"> }> {
  const { supabase } = await requirePlatformAdmin();
  const values = validateOccupationPathwayAction(input);
  if (!values) return { error: "Use a valid action, complete text, HTTPS links, and a display order from 1 to 20." };
  const { data, error } = await supabase.from("occupation_pathway_actions").insert({ occupation_id: input.occupationId, action_type: input.actionType, title: values.title, instruction: values.instruction, why_it_helps: values.whyItHelps, organization_name: values.organizationName, location: values.location, training_program_id: values.trainingProgramId, url: values.url, source_url: values.sourceUrl, source_locator: values.sourceLocator, sort_order: values.sortOrder, contact_text: null, last_verified_at: new Date().toISOString().slice(0, 10), is_verified: false, is_active: true }).select("*").single();
  if (error) return { error: error.code === "23505" ? "That action type already exists for this occupation." : getDatabaseErrorMessage(error, "We could not add that pathway action.") };
  revalidatePath("/admin/career-guidance");
  revalidatePath("/i-want-to-become");
  return { action: data };
}

export async function updateOccupationPathwayAction(actionId: string, input: OccupationPathwayActionInput): Promise<{ error?: string; action?: Tables<"occupation_pathway_actions"> }> {
  const { supabase } = await requirePlatformAdmin();
  const values = validateOccupationPathwayAction(input);
  if (!actionId || !values) return { error: "Use a valid action, complete text, HTTPS links, and a display order from 1 to 20." };
  const { data, error } = await supabase.from("occupation_pathway_actions").update({ occupation_id: input.occupationId, action_type: input.actionType, title: values.title, instruction: values.instruction, why_it_helps: values.whyItHelps, organization_name: values.organizationName, location: values.location, training_program_id: values.trainingProgramId, url: values.url, source_url: values.sourceUrl, source_locator: values.sourceLocator, sort_order: values.sortOrder, is_verified: false }).eq("id", actionId).select("*").single();
  if (error) return { error: error.code === "23505" ? "That action type already exists for this occupation." : getDatabaseErrorMessage(error, "We could not update that pathway action.") };
  revalidatePath("/admin/career-guidance");
  revalidatePath("/i-want-to-become");
  return { action: data };
}

export async function setOccupationPathwayActionVerified(actionId: string, isVerified: boolean): Promise<{ error?: string }> {
  const { supabase } = await requirePlatformAdmin();
  if (!actionId) return { error: "Choose a pathway action first." };
  const values = isVerified ? { is_verified: true, last_verified_at: new Date().toISOString().slice(0, 10) } : { is_verified: false };
  const { error } = await supabase.from("occupation_pathway_actions").update(values).eq("id", actionId);
  if (error) return { error: getDatabaseErrorMessage(error, "We could not update that verification state.") };
  revalidatePath("/admin/career-guidance");
  revalidatePath("/i-want-to-become");
  return {};
}

export async function setOccupationPathwayActionActive(actionId: string, isActive: boolean): Promise<{ error?: string }> {
  const { supabase } = await requirePlatformAdmin();
  if (!actionId) return { error: "Choose a pathway action first." };
  const { error } = await supabase.from("occupation_pathway_actions").update({ is_active: isActive }).eq("id", actionId);
  if (error) return { error: getDatabaseErrorMessage(error, "We could not update that action.") };
  revalidatePath("/admin/career-guidance");
  revalidatePath("/i-want-to-become");
  return {};
}

export async function getConsentedResumeUrl(resumeId: string, roleId: string): Promise<{ error?: string; url?: string }> {
  const { supabase } = await requireApprovedCompanyMember();
  const { data: storagePath, error: pathError } = await supabase.rpc("get_consented_resume_path", { target_resume_id: resumeId, target_job_role_id: roleId });
  if (pathError || !storagePath) return { error: "Applicant consent is required before viewing this CV." };
  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    return { error: "The secure CV link service is not configured." };
  }
  const { data, error } = await adminClient.storage.from("resumes").createSignedUrl(storagePath, 10 * 60);
  if (error || !data.signedUrl) return { error: "We could not create a temporary CV link." };
  return { url: data.signedUrl };
}

export async function initiateDirectInterview(applicantId: string, roleId: string): Promise<{ error?: string; message?: string; invitationId?: string }> {
  const { supabase, companyId } = await requireApprovedCompanyMember();
  const cleanApplicantId = applicantId.trim();
  const cleanRoleId = roleId.trim();
  if (!cleanApplicantId || !cleanRoleId) return { error: "Choose an applicant and role first." };

  const { data: role, error: roleError } = await supabase
    .from("job_roles")
    .select("id,company_id,status")
    .eq("id", cleanRoleId)
    .eq("company_id", companyId)
    .eq("status", "active")
    .maybeSingle();
  if (roleError || !role) return { error: "That role is no longer active in your company workspace." };

  const { data: application, error: applicationError } = await supabase
    .from("job_applications")
    .select("id")
    .eq("applicant_id", cleanApplicantId)
    .eq("job_role_id", role.id)
    .eq("company_id", companyId)
    .eq("status", "applied")
    .maybeSingle();
  if (applicationError) return { error: getDatabaseErrorMessage(applicationError, "We could not verify this application.") };
  if (!application) return { error: "This applicant does not have an active application for the role." };

  const { data: existing, error: existingError } = await supabase
    .from("interview_invitations")
    .select("id,status,expires_at")
    .eq("applicant_id", cleanApplicantId)
    .eq("job_role_id", role.id)
    .is("job_fair_id", null)
    .maybeSingle();
  if (existingError) return { error: getDatabaseErrorMessage(existingError, "We could not check interview invitations.") };
  if (existing?.status === "invited") {
    if (!existing.expires_at || new Date(existing.expires_at) > new Date()) return { invitationId: existing.id, message: "Interview invitation already sent." };
    const { error: expireError } = await supabase.from("interview_invitations").delete().eq("id", existing.id).eq("status", "invited");
    if (expireError) return { error: getDatabaseErrorMessage(expireError, "We could not renew the expired interview invitation.") };
  }
  if (existing?.status === "accepted") return { error: "This applicant already accepted the interview invitation." };
  if (existing?.status === "declined") return { error: "This applicant declined the previous interview invitation." };

  const { data: invitation, error } = await supabase
    .from("interview_invitations")
    .insert({ applicant_id: cleanApplicantId, job_role_id: role.id, job_fair_id: null, status: "invited", expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() })
    .select("id")
    .single();
  if (error || !invitation) {
    return { error: error?.code === "23505" ? "An interview invitation was just sent." : getDatabaseErrorMessage(error, "We could not send the interview invitation.") };
  }

  revalidatePath("/company/candidates");
  revalidatePath("/interviews");
  return { invitationId: invitation.id, message: "Interview invitation sent." };
}

export async function respondToDirectInterview(invitationId: string, response: "accepted" | "declined"): Promise<{ error?: string; message?: string }> {
  const { supabase, user } = await requireApplicant();
  const cleanInvitationId = invitationId.trim();
  if (!cleanInvitationId || !["accepted", "declined"].includes(response)) return { error: "Choose a valid interview response." };

  const { data: invitation, error: invitationError } = await supabase
    .from("interview_invitations")
    .select("id,expires_at")
    .eq("id", cleanInvitationId)
    .eq("applicant_id", user.id)
    .is("job_fair_id", null)
    .eq("status", "invited")
    .maybeSingle();
  if (invitationError) return { error: getDatabaseErrorMessage(invitationError, "We could not load that interview invitation.") };
  if (!invitation) return { error: "That interview invitation is no longer available." };
  if (invitation.expires_at && new Date(invitation.expires_at) <= new Date()) return { error: "That interview invitation has expired." };

  const { data: updatedInvitation, error } = await supabase
    .from("interview_invitations")
    .update({ status: response })
    .eq("id", invitation.id)
    .eq("applicant_id", user.id)
    .is("job_fair_id", null)
    .eq("status", "invited")
    .select("id")
    .maybeSingle();
  if (error) return { error: getDatabaseErrorMessage(error, "We could not save your interview response.") };
  if (!updatedInvitation) return { error: "That interview invitation is no longer available." };

  revalidatePath("/interviews");
  revalidatePath("/company/candidates");
  return { message: response === "accepted" ? "You told the company you are interested." : "You declined the interview invitation." };
}

export async function cancelDirectInterview(invitationId: string): Promise<{ error?: string; message?: string }> {
  const { supabase } = await requireApprovedCompanyMember();
  const cleanInvitationId = invitationId.trim();
  if (!cleanInvitationId) return { error: "Choose an interview invitation first." };

  const { data: invitation, error: invitationError } = await supabase
    .from("interview_invitations")
    .select("id")
    .eq("id", cleanInvitationId)
    .is("job_fair_id", null)
    .eq("status", "invited")
    .maybeSingle();
  if (invitationError) return { error: getDatabaseErrorMessage(invitationError, "We could not find that interview invitation.") };
  if (!invitation) return { error: "That interview invitation is no longer active." };

  const { error } = await supabase
    .from("interview_invitations")
    .delete()
    .eq("id", invitation.id)
    .is("job_fair_id", null)
    .eq("status", "invited");
  if (error) return { error: getDatabaseErrorMessage(error, "We could not cancel the interview invitation.") };

  revalidatePath("/company/candidates");
  revalidatePath("/interviews");
  return { message: "Interview invitation cancelled." };
}

export async function shareProfileForRole(roleId: string): Promise<{ error?: string; message?: string; requiresContactDetails?: boolean }> {
  const { supabase, user } = await requireApplicant();
  const { data: role } = await supabase.from("job_roles").select("id,company_id,status").eq("id", roleId).eq("status", "active").maybeSingle();
  if (!role) return { error: "That opportunity is no longer active." };
  const { data: match } = await supabase.from("job_matches").select("id").eq("applicant_id", user.id).eq("job_role_id", roleId).eq("status", "current").maybeSingle();
  if (!match) return { error: "Complete your profile match before sharing it." };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name,phone_number")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) return { error: getDatabaseErrorMessage(profileError, "We could not check your contact details.") };
  if (!profile?.full_name?.trim() || !profile.phone_number?.trim()) {
    return {
      error: "Add your name and phone number before sharing. You can still apply without sharing your identity.",
      requiresContactDetails: true,
    };
  }

  const { data: existing, error: existingError } = await supabase.from("candidate_consents").select("id").eq("applicant_id", user.id).eq("job_role_id", roleId).maybeSingle();
  if (existingError) return { error: getDatabaseErrorMessage(existingError, "We could not check profile sharing.") };
  if (existing) {
    const { error } = await supabase.from("candidate_consents").update({ status: "active", revoked_at: null }).eq("id", existing.id).eq("applicant_id", user.id);
    if (error) return { error: getDatabaseErrorMessage(error, "We could not share your profile.") };
  } else {
    const { error } = await supabase.from("candidate_consents").insert({ applicant_id: user.id, company_id: role.company_id, job_role_id: roleId, status: "active", revoked_at: null });
    if (error) return { error: getDatabaseErrorMessage(error, "We could not share your profile.") };
  }
  revalidatePath(`/matches/${match.id}`);
  return { message: "Your profile is now shared with this company for this role." };
}

export async function revokeProfileShare(roleId: string): Promise<{ error?: string; message?: string }> {
  const { supabase, user } = await requireApplicant();
  const { error } = await supabase.from("candidate_consents").update({ status: "revoked", revoked_at: new Date().toISOString() }).eq("applicant_id", user.id).eq("job_role_id", roleId);
  if (error) return { error: getDatabaseErrorMessage(error, "We could not revoke profile sharing.") };
  revalidatePath("/dashboard");
  revalidatePath("/matches/[matchId]", "page");
  return { message: "Profile sharing was revoked for this role." };
}

const demoFallbackRoleId = "40000000-0000-0000-0000-000000000001";
const demoFallbackFairId = "50000000-0000-0000-0000-000000000001";
const demoFallbackCompanyId = "10000000-0000-0000-0000-000000000001";
const demoResetPassword = "reset1";

type DemoResetRequirement = {
  id: string;
  job_role_id: string;
  qualification_id: string;
  weight: number;
  minimum_years: number | null;
  mandatory: boolean;
};

function isDemoResetRequirementSatisfied(requirement: DemoResetRequirement, skillYears: Map<string, number>) {
  const years = skillYears.get(requirement.qualification_id);
  return years !== undefined && (requirement.minimum_years === null || years >= requirement.minimum_years);
}

export type ResetDemoFallbackResult = { error?: string; message?: string; matches?: number };

/**
 * In-app ULTRA RESET for the hackathon demo. Rebuilds the prepared fallback
 * applicant from the admin dashboard without a laptop terminal. Mirrors
 * scripts/prepare-demo-fallback.mjs: curated qualifications, deterministic
 * matches from every active curated role, one pending interview invitation
 * on the fallback role, cleared consent, and settled recalculation jobs.
 * Never creates a resume and never claims the results came from OCR or Qwen.
 *
 * Guards: platform admin only, password "reset1", and the target email must
 * be the configured DEMO_APPLICANT_EMAIL so a typo can never wipe a real
 * applicant.
 */
export async function resetDemoFallback(password: string): Promise<ResetDemoFallbackResult> {
  const { user } = await requirePlatformAdmin();
  void user;

  if (password !== demoResetPassword) return { error: "That reset password was not recognized." };

  const expectedEmail = process.env.DEMO_APPLICANT_EMAIL?.trim().toLowerCase();
  if (!expectedEmail) {
    return { error: "The prepared demo applicant is not configured." };
  }

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    return { error: "The secure reset service is not configured." };
  }

  const { data: userList, error: usersError } = await adminClient.auth.admin.listUsers();
  if (usersError) return { error: "We could not read the demo applicant. Please try again." };
  const applicant = userList.users.find((item) => item.email?.toLowerCase() === expectedEmail);
  if (!applicant) return { error: "The demo applicant does not exist. Run the setup script first." };

  const fallbackSkills = [
    { slug: "diesel-mechanics", years: 4, originalTerm: "Minibus diesel repair" },
    { slug: "mechanical-maintenance", years: 4, originalTerm: "Mechanical maintenance" },
    { slug: "bosiet", years: 0, originalTerm: "BOSIET certificate" },
    { slug: "ict-network-support", years: 4, originalTerm: "Network administration" },
    { slug: "server-administration", years: 4, originalTerm: "Server administration" },
    { slug: "database-and-sql", years: 4, originalTerm: "Database and SQL" },
    { slug: "data-analysis", years: 4, originalTerm: "Data analysis" },
  ];

  const { data: qualifications, error: qualificationsError } = await adminClient
    .from("qualifications")
    .select("id,slug")
    .in("slug", fallbackSkills.map((skill) => skill.slug));
  if (qualificationsError) return { error: getDatabaseErrorMessage(qualificationsError, "We could not read the curated taxonomy.") };
  if ((qualifications ?? []).length !== fallbackSkills.length) return { error: "The curated qualification taxonomy is incomplete." };
  const qualificationBySlug = new Map((qualifications ?? []).map((item) => [item.slug, item.id]));

  const { error: profileError } = await adminClient.from("profiles").upsert({
    id: applicant.id,
    full_name: "Prepared demo applicant",
    parish_or_region: "Georgetown",
    onboarding_completed: true,
  });
  if (profileError) return { error: getDatabaseErrorMessage(profileError, "We could not prepare the fallback profile.") };

  const { error: removeQualificationsError } = await adminClient.from("applicant_qualifications").delete().eq("applicant_id", applicant.id);
  if (removeQualificationsError) return { error: getDatabaseErrorMessage(removeQualificationsError, "We could not reset fallback qualifications.") };

  const fallbackRows = fallbackSkills.map((skill) => {
    const qualificationId = qualificationBySlug.get(skill.slug);
    if (!qualificationId) return null;
    return {
      applicant_id: applicant.id,
      qualification_id: qualificationId,
      years_experience: skill.years,
      source: "applicant_confirmed" as const,
      review_status: "confirmed" as const,
      original_term: skill.originalTerm,
      evidence: "Prepared non-sensitive fallback scenario for the hackathon demo.",
      confidence: 1,
    };
  });
  if (fallbackRows.some((row) => row === null)) return { error: "The curated qualification taxonomy is incomplete." };
  const { error: insertQualificationsError } = await adminClient
    .from("applicant_qualifications")
    .insert(fallbackRows.filter((row): row is NonNullable<typeof row> => row !== null));
  if (insertQualificationsError) return { error: getDatabaseErrorMessage(insertQualificationsError, "We could not add fallback qualifications.") };

  const { data: roles, error: rolesError } = await adminClient
    .from("job_roles")
    .select("id,eligibility_threshold")
    .eq("status", "active")
    .eq("is_demo", true);
  if (rolesError) return { error: getDatabaseErrorMessage(rolesError, "We could not read active roles.") };
  if (!roles || roles.length === 0) return { error: "No active curated roles are available." };

  const { data: requirements, error: requirementsError } = await adminClient
    .from("job_requirements")
    .select("id,job_role_id,qualification_id,weight,minimum_years,mandatory")
    .in("job_role_id", roles.map((role) => role.id));
  if (requirementsError) return { error: getDatabaseErrorMessage(requirementsError, "We could not read role requirements.") };
  const typedRequirements = (requirements ?? []) as DemoResetRequirement[];

  const skillYears = new Map(fallbackSkills.map((skill) => [qualificationBySlug.get(skill.slug) as string, skill.years]));
  const requirementsByRole = new Map(roles.map((role) => [role.id, typedRequirements.filter((requirement) => requirement.job_role_id === role.id)]));

  const { error: removeApplicationsError } = await adminClient.from("job_applications").delete().eq("applicant_id", applicant.id);
  if (removeApplicationsError) return { error: getDatabaseErrorMessage(removeApplicationsError, "We could not reset fallback applications.") };

  const { error: removeInvitationsError } = await adminClient.from("interview_invitations").delete().eq("applicant_id", applicant.id);
  if (removeInvitationsError) return { error: getDatabaseErrorMessage(removeInvitationsError, "We could not reset fallback invitations.") };

  const { error: removeMatchesError } = await adminClient.from("job_matches").delete().eq("applicant_id", applicant.id);
  if (removeMatchesError) return { error: getDatabaseErrorMessage(removeMatchesError, "We could not reset fallback matches.") };

  const matchRows = roles.map((role) => {
    const roleRequirements = requirementsByRole.get(role.id) ?? [];
    const totalWeight = roleRequirements.reduce((total, requirement) => total + requirement.weight, 0);
    const matchedWeight = roleRequirements
      .filter((requirement) => isDemoResetRequirementSatisfied(requirement, skillYears))
      .reduce((total, requirement) => total + requirement.weight, 0);
    const mandatoryMet = roleRequirements
      .filter((requirement) => requirement.mandatory)
      .every((requirement) => isDemoResetRequirementSatisfied(requirement, skillYears));
    const score = totalWeight === 0 ? 0 : Math.round((matchedWeight * 100) / totalWeight);
    return {
      applicant_id: applicant.id,
      job_role_id: role.id,
      score,
      mandatory_requirements_met: mandatoryMet,
      interview_eligible: mandatoryMet && score >= role.eligibility_threshold,
      status: "current" as const,
    };
  });

  const { data: matches, error: matchesError } = await adminClient.from("job_matches").insert(matchRows).select("id,job_role_id");
  if (matchesError) return { error: getDatabaseErrorMessage(matchesError, "We could not create fallback matches.") };

  const matchByRole = new Map((matches ?? []).map((match) => [match.job_role_id, match.id]));
  const gapRows = typedRequirements.flatMap((requirement) => {
    if (isDemoResetRequirementSatisfied(requirement, skillYears)) return [];
    const matchId = matchByRole.get(requirement.job_role_id);
    if (!matchId) return [];
    return [{ match_id: matchId, job_requirement_id: requirement.id, status: "unresolved" as const }];
  });
  if (gapRows.length === 0) return { error: "We could not connect a fallback gap to its match." };
  const { error: gapsError } = await adminClient.from("match_gaps").insert(gapRows);
  if (gapsError) return { error: getDatabaseErrorMessage(gapsError, "We could not create fallback gaps.") };

  const selectedMatch = matchRows.find((match) => match.job_role_id === demoFallbackRoleId);
  if (!selectedMatch?.interview_eligible) return { error: "The fallback role is not interview eligible; check curated requirements." };

  const { error: invitationError } = await adminClient.from("interview_invitations").insert({
    applicant_id: applicant.id,
    job_role_id: demoFallbackRoleId,
    job_fair_id: demoFallbackFairId,
    status: "pending",
  });
  if (invitationError) return { error: getDatabaseErrorMessage(invitationError, "We could not create the fallback invitation.") };

  const { error: clearConsentError } = await adminClient
    .from("candidate_consents")
    .delete()
    .eq("applicant_id", applicant.id)
    .eq("company_id", demoFallbackCompanyId)
    .eq("job_role_id", demoFallbackRoleId);
  if (clearConsentError) return { error: getDatabaseErrorMessage(clearConsentError, "We could not clear fallback consent.") };

  const { error: completedJobsError } = await adminClient
    .from("processing_jobs")
    .update({ status: "completed", completed_at: new Date().toISOString(), error_message: null })
    .eq("applicant_id", applicant.id)
    .eq("kind", "recalculate_matches")
    .in("status", ["queued", "processing", "failed"]);
  if (completedJobsError) return { error: getDatabaseErrorMessage(completedJobsError, "We could not settle fallback recalculation jobs.") };

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/interviews");
  revalidatePath("/company/candidates");
  return { matches: matchRows.length, message: `Fallback rebuilt: ${matchRows.length} matches, one eligible interview invitation, consent cleared.` };
}

export async function getConsentedCandidateResumeUrl(applicantId: string, roleId: string): Promise<{ error?: string; url?: string }> {
  const { supabase } = await requireApprovedCompanyMember();
  const { data: storagePath, error: pathError } = await supabase.rpc("get_consented_candidate_resume_path", { target_applicant_id: applicantId, target_job_role_id: roleId });
  if (pathError || !storagePath) return { error: "Applicant consent is required before viewing this CV." };
  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    return { error: "The secure CV link service is not configured." };
  }
  const { data, error } = await adminClient.storage.from("resumes").createSignedUrl(storagePath, 10 * 60);
  if (error || !data.signedUrl) return { error: "We could not create a temporary CV link." };
  return { url: data.signedUrl };
}
