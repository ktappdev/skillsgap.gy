"use server";

import { revalidatePath } from "next/cache";

import { getDatabaseErrorMessage } from "@/lib/errors";
import { requireApplicant } from "@/lib/auth/queries";
import { getTrimmedFormString, isUuid } from "@/lib/validation";

export type ProfileActionState = {
  error?: string;
  message?: string;
};

export async function updateProfile(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const { supabase, user } = await requireApplicant();
  const fullName = getTrimmedFormString(formData, "full_name");
  const contactEmail = getTrimmedFormString(formData, "contact_email");
  const phoneNumber = getTrimmedFormString(formData, "phone_number");

  if (fullName.length > 80) {
    return { error: "Your name must be 80 characters or fewer." };
  }

  if (contactEmail.length > 254 || (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))) {
    return { error: "Enter a valid contact email address." };
  }

  const phoneDigits = phoneNumber.replace(/\D/g, "");
  if (phoneNumber.length > 32 || (phoneNumber && (phoneDigits.length < 7 || !/^\+?[0-9\s().-]+$/.test(phoneNumber)))) {
    return { error: "Enter a phone number with at least 7 digits, including its country code if needed." };
  }

  const { data: existingProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { error: getDatabaseErrorMessage(profileError, "We could not load your profile.") };
  }

  const profileValues = {
    full_name: fullName || null,
    contact_email: contactEmail || null,
    phone_number: phoneNumber || null,
  };

  if (!existingProfile) {
    return { error: "We could not find your profile. Refresh and try again." };
  }

  const result = await supabase.from("profiles").update(profileValues).eq("id", user.id);

  if (result.error) {
    return { error: getDatabaseErrorMessage(result.error, "We could not save your profile.") };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/overview");
  return { message: "Profile saved." };
}

export async function applyContactSuggestion(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const { supabase } = await requireApplicant();
  const suggestionId = getTrimmedFormString(formData, "suggestion_id");
  if (!isUuid(suggestionId)) return { error: "We could not find that CV suggestion. Refresh and try again." };

  const { error } = await supabase.rpc("apply_contact_suggestion", { target_suggestion_id: suggestionId });
  if (error) return { error: getDatabaseErrorMessage(error, "We could not use those CV details. Refresh and try again.") };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/overview");
  return { message: "CV contact details saved." };
}

export async function dismissContactSuggestion(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const { supabase } = await requireApplicant();
  const suggestionId = getTrimmedFormString(formData, "suggestion_id");
  if (!isUuid(suggestionId)) return { error: "We could not find that CV suggestion. Refresh and try again." };

  const { error } = await supabase.rpc("dismiss_contact_suggestion", { target_suggestion_id: suggestionId });
  if (error) return { error: getDatabaseErrorMessage(error, "We could not dismiss those CV details. Refresh and try again.") };

  revalidatePath("/dashboard");
  return { message: "CV contact suggestion dismissed." };
}
