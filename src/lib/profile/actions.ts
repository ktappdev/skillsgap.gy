"use server";

import { revalidatePath } from "next/cache";

import { getDatabaseErrorMessage } from "@/lib/errors";
import { requireApplicant } from "@/lib/auth/queries";
import { getTrimmedFormString } from "@/lib/validation";

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
