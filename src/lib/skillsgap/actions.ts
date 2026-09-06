"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireApplicant, requireApprovedCompanyMember, requirePlatformAdmin, requireUser } from "@/lib/auth/queries";
import { getDatabaseErrorMessage } from "@/lib/errors";
import { isCompanyDescription, normalizeCompanyWebsite } from "@/lib/company/access-request";
import { parseGuyanaDateTime } from "@/lib/guyana-time";
import type { CareerActionType } from "@/lib/i-want-to-become/guidance";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/database.types";

const maxResumeBytes = 15 * 1024 * 1024;

export type QueueResumeResult = { error?: string; resumeId?: string };
export type ClearApplicantPathwayResult = { error?: string };

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
    return { error: "This is a demo — clear your previous CV first." };
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
      return { error: "This is a demo — clear your previous CV first." };
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

export async function confirmExtractionFinding(findingId: string, qualificationId: string): Promise<{ error?: string }> {
  const { supabase } = await requireApplicant();
  const { error } = await supabase.rpc("confirm_extraction_finding", {
    target_finding_id: findingId,
    target_qualification_id: qualificationId,
  });
  if (error) return { error: getDatabaseErrorMessage(error, "We could not confirm that translation.") };
  revalidatePath("/dashboard");
  return {};
}

export async function rejectExtractionFinding(findingId: string): Promise<{ error?: string }> {
  const { supabase } = await requireApplicant();
  const { error } = await supabase.rpc("reject_extraction_finding", { target_finding_id: findingId });
  if (error) return { error: getDatabaseErrorMessage(error, "We could not remove that finding.") };
  revalidatePath("/dashboard");
  return {};
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

export async function requestCompanyAccess(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("company") ?? "").trim();
  const website = normalizeCompanyWebsite(String(formData.get("website") ?? ""));
  const description = String(formData.get("description") ?? "").trim();
  if (name.length < 2 || name.length > 160 || !website.ok || !isCompanyDescription(description)) redirect("/company/request-access?error=company");

  const { error } = await supabase.from("companies").insert({
    name,
    website_url: website.value,
    description: description || null,
    requested_by: user.id,
    status: "pending",
  });
  if (error) redirect(`/company/request-access?error=${error.code === "23505" ? "duplicate" : "save"}`);
  revalidatePath("/admin/companies");
  redirect("/company/request-access?submitted=1");
}

export async function reviewCompany(companyId: string, status: "approved" | "rejected"): Promise<{ error?: string }> {
  const { supabase, user } = await requirePlatformAdmin();
  const { error } = await supabase.from("companies").update({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", companyId);
  if (error) return { error: getDatabaseErrorMessage(error, "Only a platform administrator can review companies.") };
  revalidatePath("/admin/companies");
  return {};
}

export async function createJobRole(title: string, threshold: number): Promise<{ error?: string; role?: Tables<"job_roles"> }> {
  const { supabase, user, companyId } = await requireApprovedCompanyMember();
  const cleanTitle = title.trim();
  if (cleanTitle.length < 2 || cleanTitle.length > 160 || !Number.isInteger(threshold) || threshold < 1 || threshold > 100) return { error: "Enter a role name and a threshold from 1 to 100." };
  const { data, error } = await supabase.from("job_roles").insert({ company_id: companyId, title: cleanTitle, created_by: user.id, eligibility_threshold: threshold, description: "", location: "Guyana", status: "draft" }).select("*").single();
  if (error) return { error: getDatabaseErrorMessage(error, "We could not create that role.") };
  revalidatePath("/company/jobs");
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
  if (error) return { error: getDatabaseErrorMessage(error, "We could not update that role.") };
  revalidatePath("/company/jobs");
  return {};
}

export async function addJobRequirement(
  roleId: string,
  qualificationId: string,
  kind: Tables<"job_requirements">["kind"],
  weight: number,
  mandatory: boolean,
  minimumYears: number | null,
): Promise<{ error?: string; requirement?: Tables<"job_requirements"> }> {
  const { supabase } = await requireApprovedCompanyMember();
  const allowedKinds: Tables<"job_requirements">["kind"][] = ["technical_skill", "certification", "compliance", "experience"];
  if (!allowedKinds.includes(kind) || typeof mandatory !== "boolean" || !Number.isInteger(weight) || weight < 1 || weight > 5 || (minimumYears !== null && (!Number.isFinite(minimumYears) || minimumYears < 0 || minimumYears > 60))) {
    return { error: "Use a weight from 1 to 5 and experience from 0 to 60 years." };
  }
  const { data, error } = await supabase.from("job_requirements").insert({ job_role_id: roleId, qualification_id: qualificationId, kind, weight, mandatory, minimum_years: minimumYears }).select("*").single();
  if (error) return { error: getDatabaseErrorMessage(error, "We could not add that requirement.") };
  revalidatePath("/company/jobs");
  return { requirement: data };
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

export async function createQualification(name: string, slug: string, category: "technical_skill" | "certification" | "compliance" | "experience"): Promise<{ error?: string; qualification?: Tables<"qualifications"> }> {
  const { supabase } = await requirePlatformAdmin();
  const cleanName = name.trim();
  const cleanSlug = slug.trim().toLowerCase();
  if (cleanName.length < 2 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug)) return { error: "Use a name and a lowercase slug such as hydraulic-maintenance." };
  const { data, error } = await supabase.from("qualifications").insert({ name: cleanName, slug: cleanSlug, category, description: null, is_active: true }).select("*").single();
  if (error) return { error: getDatabaseErrorMessage(error, "We could not create that qualification.") };
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
  const allowedCategories: Tables<"qualifications">["category"][] = ["technical_skill", "certification", "compliance", "experience"];
  if (!qualificationId || cleanName.length < 2 || cleanName.length > 160 || !allowedCategories.includes(category) || cleanDescription.length > 500) {
    return { error: "Use a valid qualification name, category, and description." };
  }
  const { data, error } = await supabase
    .from("qualifications")
    .update({ name: cleanName, category, description: cleanDescription || null, is_active: isActive })
    .eq("id", qualificationId)
    .select("*")
    .single();
  if (error) return { error: getDatabaseErrorMessage(error, "We could not update that qualification.") };
  revalidatePath("/admin/qualifications");
  return { qualification: data };
}

export async function createQualificationAlias(qualificationId: string, alias: string): Promise<{ error?: string; alias?: Tables<"qualification_aliases"> }> {
  const { supabase } = await requirePlatformAdmin();
  const cleanAlias = alias.trim();
  if (!qualificationId || cleanAlias.length < 2 || cleanAlias.length > 160) return { error: "Use an alias between 2 and 160 characters." };
  const { data, error } = await supabase.from("qualification_aliases").insert({ qualification_id: qualificationId, alias: cleanAlias }).select("*").single();
  if (error) return { error: error.code === "23505" ? "That alias is already mapped." : getDatabaseErrorMessage(error, "We could not add that alias.") };
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

export async function setTrainingProviderVerified(providerId: string, isVerified: boolean): Promise<{ error?: string }> {
  const { supabase } = await requirePlatformAdmin();
  const { error } = await supabase.from("training_providers").update({ is_verified: isVerified }).eq("id", providerId);
  if (error) return { error: getDatabaseErrorMessage(error, "We could not update provider verification.") };
  revalidatePath("/admin/training");
  return {};
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

export async function shareProfileForRole(roleId: string): Promise<{ error?: string; message?: string }> {
  const { supabase, user } = await requireApplicant();
  const { data: role } = await supabase.from("job_roles").select("id,company_id,status").eq("id", roleId).eq("status", "active").maybeSingle();
  if (!role) return { error: "That opportunity is no longer active." };
  const { data: match } = await supabase.from("job_matches").select("id").eq("applicant_id", user.id).eq("job_role_id", roleId).eq("status", "current").maybeSingle();
  if (!match) return { error: "Complete your profile match before sharing it." };

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
 * matches from every active approved role, one pending interview invitation
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

  const { data: roles, error: rolesError } = await adminClient.from("job_roles").select("id,eligibility_threshold").eq("status", "active");
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
