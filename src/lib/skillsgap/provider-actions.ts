"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireTrainingProvider, requireUser } from "@/lib/auth/queries";
import { getDatabaseErrorMessage } from "@/lib/errors";
import { getTrimmedFormString } from "@/lib/validation";

const NAME_MIN = 2;
const NAME_MAX = 160;
const DESCRIPTION_MAX = 2000;
const PHONE_MAX = 160;
const DURATION_MAX = 160;

export type ProviderActionResult = { error?: string };

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function cleanOptionalUrl(value: string) {
  const cleaned = value.trim();
  if (!cleaned) return null;
  return isHttpsUrl(cleaned) ? cleaned : null;
}

function validateProviderFields(name: string, location: string, contactPhone: string, contactUrl: string, description: string): { error?: string; values?: ProviderUpdateValues } {
  const cleanName = name.trim();
  const cleanLocation = location.trim();
  const cleanDescription = description.trim();

  if (cleanName.length < NAME_MIN || cleanName.length > NAME_MAX) {
    return { error: "Add a provider name between 2 and 160 characters." };
  }
  if (cleanLocation.length < NAME_MIN || cleanLocation.length > NAME_MAX) {
    return { error: "Add a location between 2 and 160 characters." };
  }

  const cleanPhone = contactPhone.trim();
  if (cleanPhone.length > PHONE_MAX) {
    return { error: "Phone numbers must be 160 characters or fewer." };
  }

  const cleanUrl = contactUrl.trim();
  if (cleanUrl && !isHttpsUrl(cleanUrl)) {
    return { error: "Add a valid HTTPS contact URL." };
  }

  if (cleanDescription.length > DESCRIPTION_MAX) {
    return { error: "Descriptions must be 2000 characters or fewer." };
  }

  return {
    values: {
      name: cleanName,
      location: cleanLocation,
      contact_phone: cleanPhone || null,
      contact_url: cleanUrl || null,
      description: cleanDescription || null,
    },
  };
}

type ProviderUpdateValues = {
  name: string;
  location: string;
  contact_phone: string | null;
  contact_url: string | null;
  description: string | null;
};

/**
 * Self-signup: creates an unverified training provider owned by the signed-in
 * user. RLS enforces `is_verified = false` on insert; this action never sets it.
 */
export async function createProviderAccount(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();

  // A user may only own one provider. If they already do, send them there.
  const { data: existing } = await supabase
    .from("training_providers")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (existing) redirect("/provider");

  const name = getTrimmedFormString(formData, "name");
  const location = getTrimmedFormString(formData, "location");
  const contactPhone = getTrimmedFormString(formData, "contact_phone");
  const contactUrl = getTrimmedFormString(formData, "contact_url");
  const description = getTrimmedFormString(formData, "description");

  const check = validateProviderFields(name, location, contactPhone, contactUrl, description);
  if (check.error) redirect(`/provider/setup?error=${encodeURIComponent(check.error)}`);

  const { error } = await supabase.from("training_providers").insert({
    owner_user_id: user.id,
    name: check.values!.name,
    location: check.values!.location,
    contact_phone: check.values!.contact_phone,
    contact_url: check.values!.contact_url,
    description: check.values!.description,
    is_verified: false,
  });

  if (error) {
    const message = error.code === "23505" ? "That provider already exists at this location." : getDatabaseErrorMessage(error, "We could not create your provider profile.");
    redirect(`/provider/setup?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/provider");
  redirect("/provider");
}

/**
 * Updates the five self-service profile fields. NEVER updates `is_verified` —
 * only platform admins can change verification state.
 */
export async function updateProviderProfile(formData: FormData): Promise<ProviderActionResult> {
  const { supabase, provider } = await requireTrainingProvider();

  const name = getTrimmedFormString(formData, "name");
  const location = getTrimmedFormString(formData, "location");
  const contactPhone = getTrimmedFormString(formData, "contact_phone");
  const contactUrl = getTrimmedFormString(formData, "contact_url");
  const description = getTrimmedFormString(formData, "description");

  const check = validateProviderFields(name, location, contactPhone, contactUrl, description);
  if (check.error) return { error: check.error };

  const { error } = await supabase
    .from("training_providers")
    .update({
      name: check.values!.name,
      location: check.values!.location,
      contact_phone: check.values!.contact_phone,
      contact_url: check.values!.contact_url,
      description: check.values!.description,
    })
    .eq("id", provider.id);

  if (error) {
    if (error.code === "23505") return { error: "That provider already exists at this location." };
    return { error: getDatabaseErrorMessage(error, "We could not update your provider profile.") };
  }

  revalidatePath("/provider");
  return {};
}

export async function createProviderProgram(formData: FormData): Promise<ProviderActionResult> {
  const { supabase, provider } = await requireTrainingProvider();

  const name = getTrimmedFormString(formData, "name");
  const description = getTrimmedFormString(formData, "description");
  const durationText = getTrimmedFormString(formData, "duration_text");
  const enrollmentUrl = getTrimmedFormString(formData, "enrollment_url");

  if (name.length < NAME_MIN || name.length > NAME_MAX) {
    return { error: "Add a program name between 2 and 160 characters." };
  }
  if (description.length > DESCRIPTION_MAX) {
    return { error: "Descriptions must be 2000 characters or fewer." };
  }
  if (durationText.length > DURATION_MAX) {
    return { error: "Duration must be 160 characters or fewer." };
  }
  const enrollment = cleanOptionalUrl(enrollmentUrl);
  if (enrollmentUrl.trim() && enrollment === null) {
    return { error: "Add a valid HTTPS enrollment URL." };
  }

  const { error } = await supabase
    .from("training_programs")
    .insert({
      provider_id: provider.id,
      name,
      description: description || null,
      duration_text: durationText || null,
      enrollment_url: enrollment,
      is_active: true,
    });

  if (error) {
    if (error.code === "23505") return { error: "That program already exists for your provider." };
    return { error: getDatabaseErrorMessage(error, "We could not add that program.") };
  }

  revalidatePath("/provider");
  return {};
}

export async function updateProviderProgram(formData: FormData): Promise<ProviderActionResult> {
  const { supabase, provider } = await requireTrainingProvider();

  const programId = getTrimmedFormString(formData, "programId");
  if (!programId) return { error: "Choose a program to edit." };

  const name = getTrimmedFormString(formData, "name");
  const description = getTrimmedFormString(formData, "description");
  const durationText = getTrimmedFormString(formData, "duration_text");
  const enrollmentUrl = getTrimmedFormString(formData, "enrollment_url");

  if (name.length < NAME_MIN || name.length > NAME_MAX) {
    return { error: "Add a program name between 2 and 160 characters." };
  }
  if (description.length > DESCRIPTION_MAX) {
    return { error: "Descriptions must be 2000 characters or fewer." };
  }
  if (durationText.length > DURATION_MAX) {
    return { error: "Duration must be 160 characters or fewer." };
  }
  const enrollment = cleanOptionalUrl(enrollmentUrl);
  if (enrollmentUrl.trim() && enrollment === null) {
    return { error: "Add a valid HTTPS enrollment URL." };
  }

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
    .update({
      name,
      description: description || null,
      duration_text: durationText || null,
      enrollment_url: enrollment,
    })
    .eq("id", programId)
    .eq("provider_id", provider.id);

  if (error) {
    if (error.code === "23505") return { error: "That program already exists for your provider." };
    return { error: getDatabaseErrorMessage(error, "We could not update that program.") };
  }

  revalidatePath("/provider");
  return {};
}

export async function setProviderProgramActive(formData: FormData): Promise<ProviderActionResult> {
  const { supabase, provider } = await requireTrainingProvider();

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

  const { error } = await supabase
    .from("training_programs")
    .update({ is_active: isActive })
    .eq("id", programId)
    .eq("provider_id", provider.id);

  if (error) return { error: getDatabaseErrorMessage(error, "We could not update that program.") };

  revalidatePath("/provider");
  return {};
}

export async function mapProviderOutcome(formData: FormData): Promise<ProviderActionResult> {
  const { supabase, provider } = await requireTrainingProvider();

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

  const { error } = await supabase.from("training_program_outcomes").insert({
    training_program_id: programId,
    qualification_id: qualificationId,
  });

  // 23505 means the outcome is already mapped — treat as success.
  if (error && error.code !== "23505") {
    return { error: getDatabaseErrorMessage(error, "We could not map that outcome.") };
  }

  revalidatePath("/provider");
  return {};
}

export async function removeProviderOutcome(formData: FormData): Promise<ProviderActionResult> {
  const { supabase, provider } = await requireTrainingProvider();

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

  const { error } = await supabase
    .from("training_program_outcomes")
    .delete()
    .eq("training_program_id", programId)
    .eq("qualification_id", qualificationId);

  if (error) return { error: getDatabaseErrorMessage(error, "We could not remove that outcome.") };

  revalidatePath("/provider");
  return {};
}
