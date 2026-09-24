"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireTrainingProvider, requireUser } from "@/lib/auth/queries";
import { getDatabaseErrorMessage } from "@/lib/errors";
import { getTrimmedFormString } from "@/lib/validation";
import {
  validateProviderProfile,
  validateProviderProgram,
  validateProviderVerification,
} from "@/lib/skillsgap/provider-validation";
import type { RequirementKind } from "@/lib/supabase/database.types";

const NAME_MIN = 2;
const NAME_MAX = 160;

export type ProviderActionResult = { error?: string; message?: string };

type ProviderSetupFormValues = Record<string, string>;

function redirectToProviderSetup(error: string, values: ProviderSetupFormValues): never {
  const params = new URLSearchParams({ error });
  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value);
  }
  redirect(`/provider/setup?${params.toString()}`);
}

/**
 * Self-signup: creates an unverified training provider owned by the signed-in
 * user. RLS enforces `is_verified = false` on insert; this action never sets it.
 */
export async function createProviderAccount(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser("/provider/setup");

  const values = {
    name: getTrimmedFormString(formData, "name"),
    provider_type: getTrimmedFormString(formData, "provider_type"),
    location: getTrimmedFormString(formData, "location"),
    physical_address: getTrimmedFormString(formData, "physical_address"),
    service_area: getTrimmedFormString(formData, "service_area"),
    contact_email: getTrimmedFormString(formData, "contact_email"),
    contact_phone: getTrimmedFormString(formData, "contact_phone"),
    contact_url: getTrimmedFormString(formData, "contact_url"),
    description: getTrimmedFormString(formData, "description"),
  };

  const [{ data: existing, error: existingError }, { data: profile, error: profileError }] = await Promise.all([
    supabase.from("training_providers").select("id").eq("owner_user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("account_type").eq("id", user.id).maybeSingle(),
  ]);

  if (existingError || profileError || !profile) {
    redirectToProviderSetup("We could not load your provider account. Refresh and try again.", values);
  }
  if (existing) redirect("/provider");
  if (profile.account_type !== "provider") {
    redirectToProviderSetup("Use a separate account for training provider work.", values);
  }

  const check = validateProviderProfile(values);
  if (check.error || !check.values) redirectToProviderSetup(check.error ?? "Check the provider details and try again.", values);

  const { error } = await supabase.from("training_providers").insert({
    owner_user_id: user.id,
    ...check.values,
    is_verified: false,
  });

  if (error) {
    if (error.code === "23505") {
      const { data: ownerProvider, error: ownerError } = await supabase
        .from("training_providers")
        .select("id")
        .eq("owner_user_id", user.id)
        .maybeSingle();
      if (ownerError) redirectToProviderSetup("Your provider account may still be being created. Refresh and try again.", values);
      if (ownerProvider) redirect("/provider");
      redirectToProviderSetup("That provider is already listed at this location. Choose a different name or ask a platform administrator to connect the existing listing.", values);
    }
    redirectToProviderSetup(getDatabaseErrorMessage(error, "We could not create your provider profile. Refresh and try again."), values);
  }

  revalidatePath("/provider");
  redirect("/provider");
}

/**
 * Updates the five self-service profile fields. NEVER updates `is_verified` —
 * only platform admins can change verification state.
 */
export async function updateProviderProfile(formData: FormData): Promise<ProviderActionResult> {
  const { supabase, provider } = await requireTrainingProvider("/provider");

  const check = validateProviderProfile({
    name: getTrimmedFormString(formData, "name"),
    provider_type: getTrimmedFormString(formData, "provider_type"),
    location: getTrimmedFormString(formData, "location"),
    physical_address: getTrimmedFormString(formData, "physical_address"),
    service_area: getTrimmedFormString(formData, "service_area"),
    contact_email: getTrimmedFormString(formData, "contact_email"),
    contact_phone: getTrimmedFormString(formData, "contact_phone"),
    contact_url: getTrimmedFormString(formData, "contact_url"),
    description: getTrimmedFormString(formData, "description"),
  });
  if (check.error || !check.values) return { error: check.error ?? "Check the provider details and try again." };

  const { error } = await supabase
    .from("training_providers")
    .update(check.values)
    .eq("id", provider.id);

  if (error) {
    if (error.code === "23505") return { error: "That provider already exists at this location." };
    return { error: getDatabaseErrorMessage(error, "We could not update your provider profile.") };
  }

  revalidatePath("/provider");
  revalidatePath("/training");
  revalidatePath(`/training/providers/${provider.id}`);
  return { message: "Provider profile saved." };
}

export async function saveProviderVerificationDetails(formData: FormData): Promise<ProviderActionResult> {
  const { supabase, provider } = await requireTrainingProvider("/provider");
  const check = validateProviderVerification({
    legal_name: getTrimmedFormString(formData, "legal_name"),
    registration_number: getTrimmedFormString(formData, "registration_number"),
    accrediting_body: getTrimmedFormString(formData, "accrediting_body"),
    accreditation_reference: getTrimmedFormString(formData, "accreditation_reference"),
    evidence_url: getTrimmedFormString(formData, "evidence_url"),
    notes: getTrimmedFormString(formData, "notes"),
  });
  if (check.error || !check.values) return { error: check.error ?? "Check the verification details and try again." };

  const { error } = await supabase
    .from("training_provider_verification_details")
    .upsert({ ...check.values, provider_id: provider.id, submitted_at: new Date().toISOString() }, { onConflict: "provider_id" });
  if (error) return { error: getDatabaseErrorMessage(error, "We could not submit your verification details.") };

  revalidatePath("/provider");
  revalidatePath("/admin/training");
  revalidatePath("/training");
  revalidatePath(`/training/providers/${provider.id}`);
  return {
    message: provider.is_verified
      ? "Updated verification evidence sent for review. Your public listings are hidden until approval."
      : "Verification details sent for admin review.",
  };
}

export async function createProviderProgram(formData: FormData): Promise<ProviderActionResult> {
  const { supabase, provider } = await requireTrainingProvider("/provider/programs");
  const check = validateProviderProgram(readProviderProgramInput(formData));
  if (check.error || !check.values) return { error: check.error ?? "Check the program details and try again." };

  const { error } = await supabase
    .from("training_programs")
    .insert({
      provider_id: provider.id,
      ...check.values,
      is_active: false,
    });

  if (error) {
    if (error.code === "23505") return { error: "That program already exists for your provider." };
    return { error: getDatabaseErrorMessage(error, "We could not add that program.") };
  }

  revalidateProviderTraining(provider.id);
  return { message: "Program saved as a draft. Map its outcomes before publishing." };
}

export async function updateProviderProgram(formData: FormData): Promise<ProviderActionResult> {
  const { supabase, provider } = await requireTrainingProvider("/provider/programs");

  const programId = getTrimmedFormString(formData, "programId");
  if (!programId) return { error: "Choose a program to edit." };

  const check = validateProviderProgram(readProviderProgramInput(formData));
  if (check.error || !check.values) return { error: check.error ?? "Check the program details and try again." };

  // Verify the program belongs to this provider before updating.
  const { data: owned, error: ownershipError } = await supabase
    .from("training_programs")
    .select("id")
    .eq("id", programId)
    .eq("provider_id", provider.id)
    .maybeSingle();
  if (ownershipError || !owned) return { error: "That program is not part of your provider workspace." };

  const { error } = await supabase
    .from("training_programs")
    .update(check.values)
    .eq("id", programId)
    .eq("provider_id", provider.id);

  if (error) {
    if (error.code === "23505") return { error: "That program already exists for your provider." };
    return { error: getDatabaseErrorMessage(error, "We could not update that program.") };
  }

  revalidateProviderTraining(provider.id, programId);
  return { message: "Program details saved." };
}

export async function setProviderProgramActive(formData: FormData): Promise<ProviderActionResult> {
  const { supabase, provider } = await requireTrainingProvider("/provider/programs");

  const programId = getTrimmedFormString(formData, "programId");
  const rawActive = getTrimmedFormString(formData, "isActive");
  if (!programId) return { error: "Choose a program first." };
  const isActive = rawActive === "true";
  if (rawActive !== "true" && rawActive !== "false") return { error: "Choose an active state for the program." };

  // Verify ownership before toggling.
  const { data: owned, error: ownershipError } = await supabase
    .from("training_programs")
    .select("id")
    .eq("id", programId)
    .eq("provider_id", provider.id)
    .maybeSingle();
  if (ownershipError || !owned) return { error: "That program is not part of your provider workspace." };

  if (isActive) {
    const { data: outcomes, error: outcomeError } = await supabase
      .from("training_program_outcomes")
      .select("qualification_id")
      .eq("training_program_id", programId);
    if (outcomeError) return { error: getDatabaseErrorMessage(outcomeError, "We could not check this program's outcomes.") };
    const qualificationIds = [...new Set((outcomes ?? []).map((outcome) => outcome.qualification_id))];
    if (qualificationIds.length === 0) return { error: "Map at least one approved qualification before publishing this program." };

    const { count, error: qualificationError } = await supabase
      .from("qualifications")
      .select("id", { count: "exact", head: true })
      .in("id", qualificationIds)
      .eq("is_active", true);
    if (qualificationError) return { error: getDatabaseErrorMessage(qualificationError, "We could not check this program's outcomes.") };
    if (!count) return { error: "Wait until an admin approves a qualification outcome before publishing this program." };
  }

  const { error } = await supabase
    .from("training_programs")
    .update({ is_active: isActive })
    .eq("id", programId)
    .eq("provider_id", provider.id);

  if (error) return { error: getDatabaseErrorMessage(error, "We could not update that program.") };

  revalidateProviderTraining(provider.id, programId);
  return { message: isActive ? "Program published to your verified provider catalogue." : "Program moved to drafts." };
}

export async function mapProviderOutcome(formData: FormData): Promise<ProviderActionResult> {
  const { supabase, provider } = await requireTrainingProvider("/provider/programs");

  const programId = getTrimmedFormString(formData, "programId");
  const qualificationId = getTrimmedFormString(formData, "qualificationId");
  if (!programId || !qualificationId) return { error: "Choose a program and qualification." };

  // Verify the program belongs to this provider before mapping.
  const { data: owned, error: ownershipError } = await supabase
    .from("training_programs")
    .select("id")
    .eq("id", programId)
    .eq("provider_id", provider.id)
    .maybeSingle();
  if (ownershipError || !owned) return { error: "That program is not part of your provider workspace." };

  const { data: qualification, error: qualificationError } = await supabase
    .from("qualifications")
    .select("id")
    .eq("id", qualificationId)
    .eq("is_active", true)
    .maybeSingle();
  if (qualificationError || !qualification) return { error: "Only approved qualifications can be mapped to a program." };

  const { error } = await supabase.from("training_program_outcomes").insert({
    training_program_id: programId,
    qualification_id: qualificationId,
  });

  // 23505 means the outcome is already mapped — treat as success.
  if (error && error.code !== "23505") {
    return { error: getDatabaseErrorMessage(error, "We could not map that outcome.") };
  }

  revalidateProviderTraining(provider.id, programId);
  return { message: "Approved qualification mapped to this program." };
}

export async function removeProviderOutcome(formData: FormData): Promise<ProviderActionResult> {
  const { supabase, provider } = await requireTrainingProvider("/provider/programs");

  const programId = getTrimmedFormString(formData, "programId");
  const qualificationId = getTrimmedFormString(formData, "qualificationId");
  if (!programId || !qualificationId) return { error: "Choose a program and qualification." };

  // Verify ownership before deleting.
  const { data: owned, error: ownershipError } = await supabase
    .from("training_programs")
    .select("id")
    .eq("id", programId)
    .eq("provider_id", provider.id)
    .maybeSingle();
  if (ownershipError || !owned) return { error: "That program is not part of your provider workspace." };

  const { data: activeProgram, error: programError } = await supabase
    .from("training_programs")
    .select("is_active")
    .eq("id", programId)
    .eq("provider_id", provider.id)
    .maybeSingle();
  if (programError || !activeProgram) return { error: "That program is not part of your provider workspace." };

  if (activeProgram.is_active) {
    const { data: activeOutcomes, error: activeOutcomeError } = await supabase
      .from("training_program_outcomes")
      .select("qualification_id")
      .eq("training_program_id", programId)
      .neq("qualification_id", qualificationId);
    if (activeOutcomeError) return { error: getDatabaseErrorMessage(activeOutcomeError, "We could not check this program's outcomes.") };
    const otherQualificationIds = [...new Set((activeOutcomes ?? []).map((outcome) => outcome.qualification_id))];
    const { count, error: qualificationError } = otherQualificationIds.length > 0
      ? await supabase.from("qualifications").select("id", { count: "exact", head: true }).in("id", otherQualificationIds).eq("is_active", true)
      : { count: 0, error: null };
    if (qualificationError) return { error: getDatabaseErrorMessage(qualificationError, "We could not check this program's outcomes.") };
    if (!count) return { error: "Deactivate this program or map another approved outcome before removing its only recommendation." };
  }

  const { error } = await supabase
    .from("training_program_outcomes")
    .delete()
    .eq("training_program_id", programId)
    .eq("qualification_id", qualificationId);

  if (error) return { error: getDatabaseErrorMessage(error, "We could not remove that outcome.") };

  revalidateProviderTraining(provider.id, programId);
  return { message: "Outcome removed." };
}

/** Verified providers can suggest new qualifications for admin review. */
export async function createProviderQualification(formData: FormData): Promise<ProviderActionResult> {
  const { supabase, provider } = await requireTrainingProvider("/provider/programs");
  if (!provider.is_verified) return { error: "Only verified training providers can add new qualifications." };

  const programId = getTrimmedFormString(formData, "programId");
  const name = getTrimmedFormString(formData, "name");
  const category = getTrimmedFormString(formData, "category");
  const description = getTrimmedFormString(formData, "description");

  if (!programId || !name) return { error: "Choose a program and qualification name." };
  if (name.length < NAME_MIN || name.length > NAME_MAX) return { error: "Add a qualification name between 2 and 160 characters." };
  const allowedCategories: RequirementKind[] = ["technical_skill", "certification", "compliance", "experience", "education"];
  if (!category || !allowedCategories.includes(category as RequirementKind)) return { error: "Choose a valid category." };
  if (description.length > 500) return { error: "Descriptions must be 500 characters or fewer." };

  // Auto-generate a kebab-case slug from the name.
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return { error: "Could not generate a valid slug from that name. Use letters and numbers only." };

  // Verify the program belongs to this provider before mapping an outcome.
  const { data: owned, error: ownershipError } = await supabase
    .from("training_programs")
    .select("id")
    .eq("id", programId)
    .eq("provider_id", provider.id)
    .maybeSingle();
  if (ownershipError || !owned) return { error: "That program is not part of your provider workspace." };

  const { data: qualification, error: qualError } = await supabase
    .from("qualifications")
    .insert({
      name,
      slug,
      category: category as RequirementKind,
      description: description || null,
      is_active: false,
      submitted_by_provider_id: provider.id,
      submission_status: "pending",
    })
    .select("id")
    .single();
  let qualificationId = qualification?.id;
  if (qualError?.code === "23505") {
    const { data: existingSuggestion, error: existingSuggestionError } = await supabase
      .from("qualifications")
      .select("id,submission_status")
      .eq("slug", slug)
      .eq("submitted_by_provider_id", provider.id)
      .maybeSingle();
    if (existingSuggestionError) return { error: getDatabaseErrorMessage(existingSuggestionError, "We could not find the previous qualification suggestion.") };
    if (existingSuggestion?.submission_status === "rejected") {
      const { data: revisedSuggestion, error: reviseError } = await supabase
        .from("qualifications")
        .update({
          name,
          category: category as RequirementKind,
          description: description || null,
          is_active: false,
          submission_status: "pending",
          qualification_reviewed_by: null,
          qualification_reviewed_at: null,
          qualification_review_reason: null,
          qualification_review_decision: null,
          resolved_qualification_id: null,
        })
        .eq("id", existingSuggestion.id)
        .eq("submission_status", "rejected")
        .select("id")
        .maybeSingle();
      if (reviseError) return { error: getDatabaseErrorMessage(reviseError, "We could not resubmit that qualification suggestion.") };
      qualificationId = revisedSuggestion?.id;
    } else if (existingSuggestion?.submission_status === "pending") {
      qualificationId = existingSuggestion.id;
    }
    if (!qualificationId) return { error: "A qualification with that name already exists. Search for its approved name above or revise your previous suggestion." };
  } else if (qualError || !qualificationId) {
    return { error: getDatabaseErrorMessage(qualError, "We could not create that qualification.") };
  }

  const { error: outcomeError } = await supabase.from("training_program_outcomes").insert({
    training_program_id: programId,
    qualification_id: qualificationId,
  });
  // 23505 means the outcome is already mapped — treat as success.
  if (outcomeError && outcomeError.code !== "23505") {
    return { error: getDatabaseErrorMessage(outcomeError, "The qualification was created but could not be mapped to the program.") };
  }

  revalidateProviderTraining(provider.id, programId);
  revalidatePath("/admin/qualifications");
  return { message: "Qualification submitted for admin review. It will be eligible for recommendations once approved." };
}

function readProviderProgramInput(formData: FormData) {
  return {
    name: getTrimmedFormString(formData, "name"),
    description: getTrimmedFormString(formData, "description"),
    duration_text: getTrimmedFormString(formData, "duration_text"),
    enrollment_url: getTrimmedFormString(formData, "enrollment_url"),
    award_title: getTrimmedFormString(formData, "award_title"),
    qualification_level: getTrimmedFormString(formData, "qualification_level"),
    delivery_mode: getTrimmedFormString(formData, "delivery_mode"),
    delivery_location: getTrimmedFormString(formData, "delivery_location"),
    entry_requirements: getTrimmedFormString(formData, "entry_requirements"),
    schedule_text: getTrimmedFormString(formData, "schedule_text"),
    intake_text: getTrimmedFormString(formData, "intake_text"),
    next_intake_date: getTrimmedFormString(formData, "next_intake_date"),
    application_deadline: getTrimmedFormString(formData, "application_deadline"),
    fee_amount: getTrimmedFormString(formData, "fee_amount"),
    fee_currency: getTrimmedFormString(formData, "fee_currency"),
    fee_notes: getTrimmedFormString(formData, "fee_notes"),
  };
}

function revalidateProviderTraining(providerId: string, programId?: string) {
  revalidatePath("/provider");
  revalidatePath("/provider/programs");
  revalidatePath("/training");
  revalidatePath(`/training/providers/${providerId}`);
  if (programId) revalidatePath(`/training/${programId}`);
}
