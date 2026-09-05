"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireApprovedCompanyMember, requirePlatformAdmin, requireUser } from "@/lib/auth/queries";
import { getDatabaseErrorMessage } from "@/lib/errors";
import { parseGuyanaDateTime } from "@/lib/guyana-time";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/database.types";

const maxResumeBytes = 15 * 1024 * 1024;

export type QueueResumeResult = { error?: string; resumeId?: string };

export async function queueResumeProcessing(
  storagePath: string,
  originalFilename: string,
  byteSize: number,
): Promise<QueueResumeResult> {
  const { supabase, user } = await requireUser();
  const cleanPath = storagePath.trim();
  const cleanFilename = originalFilename.trim();

  if (!cleanPath.startsWith(`${user.id}/`) || cleanPath.includes("..")) {
    return { error: "That CV path is not valid for your account." };
  }
  if (!cleanFilename.toLowerCase().endsWith(".pdf") || byteSize <= 0 || byteSize > maxResumeBytes) {
    return { error: "Choose a PDF CV up to 15 MB." };
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
  const { supabase, user } = await requireUser();
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
  const { supabase, user } = await requireUser();
  const { error: updateError } = await supabase.from("applicant_qualifications").update({ source: "applicant_confirmed", review_status: "confirmed" }).eq("applicant_id", user.id).eq("qualification_id", qualificationId);
  if (updateError) return { error: getDatabaseErrorMessage(updateError, "We could not confirm that qualification.") };
  revalidatePath("/dashboard");
  return {};
}

export async function updateApplicantQualificationYears(qualificationId: string, yearsValue: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  const trimmed = yearsValue.trim();
  const years = trimmed === "" ? null : Number(trimmed);
  if (years !== null && (!Number.isFinite(years) || years < 0 || years > 60)) return { error: "Use experience from 0 to 60 years." };
  const { error } = await supabase.from("applicant_qualifications").update({ years_experience: years, source: "applicant_confirmed", review_status: "confirmed" }).eq("applicant_id", user.id).eq("qualification_id", qualificationId);
  if (error) return { error: getDatabaseErrorMessage(error, "We could not update that experience.") };
  revalidatePath("/dashboard");
  return {};
}

export async function updateApplicantExperience(
  experienceId: string,
  title: string,
  employer: string,
  yearsValue: string,
): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
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
  const { supabase } = await requireUser();
  const { error } = await supabase.from("match_gaps").update({ status: "plan_started" }).eq("id", gapId);
  if (error) return { error: getDatabaseErrorMessage(error, "We could not start that training plan.") };
  revalidatePath("/dashboard");
  revalidatePath("/matches/[matchId]", "page");
  return {};
}

export async function addApplicantQualification(qualificationId: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("applicant_qualifications").insert({ applicant_id: user.id, qualification_id: qualificationId, source: "applicant_confirmed", review_status: "confirmed" });
  if (error && error.code !== "23505") return { error: getDatabaseErrorMessage(error, "We could not add that qualification.") };
  revalidatePath("/dashboard");
  return {};
}

export async function removeApplicantQualification(qualificationId: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("applicant_qualifications").delete().eq("applicant_id", user.id).eq("qualification_id", qualificationId);
  if (error) return { error: getDatabaseErrorMessage(error, "We could not remove that qualification.") };
  revalidatePath("/dashboard");
  return {};
}

export async function requestCompanyAccess(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("company") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (name.length < 2 || name.length > 160) redirect("/company/request-access?error=company");

  const { error } = await supabase.from("companies").insert({
    name,
    website_url: website || null,
    description: description || null,
    requested_by: user.id,
    status: "pending",
  });
  if (error) redirect(`/company/request-access?error=${error.code === "23505" ? "duplicate" : "save"}`);
  revalidatePath("/admin/companies");
  redirect("/company/request-access?submitted=1");
}

export async function reviewCompany(companyId: string, status: "approved" | "rejected"): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
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

export async function getConsentedResumeUrl(resumeId: string, roleId: string): Promise<{ error?: string; url?: string }> {
  const { supabase } = await requireUser();
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
  const { supabase, user } = await requireUser();
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
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("candidate_consents").update({ status: "revoked", revoked_at: new Date().toISOString() }).eq("applicant_id", user.id).eq("job_role_id", roleId);
  if (error) return { error: getDatabaseErrorMessage(error, "We could not revoke profile sharing.") };
  revalidatePath("/dashboard");
  revalidatePath("/matches/[matchId]", "page");
  return { message: "Profile sharing was revoked for this role." };
}

export async function getConsentedCandidateResumeUrl(applicantId: string, roleId: string): Promise<{ error?: string; url?: string }> {
  const { supabase } = await requireUser();
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
