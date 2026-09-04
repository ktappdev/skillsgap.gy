"use server";

import { revalidatePath } from "next/cache";

import { getDatabaseErrorMessage } from "@/lib/errors";
import { requireUser } from "@/lib/auth/queries";
import { getTrimmedFormString } from "@/lib/validation";

export type ProfileActionState = {
  error?: string;
  message?: string;
};

export async function updateProfile(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const { supabase, user } = await requireUser();
  const fullName = getTrimmedFormString(formData, "full_name");
  const username = getTrimmedFormString(formData, "username");

  if (fullName.length > 80) {
    return { error: "Your name must be 80 characters or fewer." };
  }

  if (username && (username.length < 3 || username.length > 40)) {
    return { error: "Your username must be between 3 and 40 characters." };
  }

  if (username && !/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { error: "Use only letters, numbers, underscores, or hyphens in your username." };
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
    username: username || null,
  };

  const result = existingProfile
    ? await supabase.from("profiles").update(profileValues).eq("id", user.id)
    : await supabase.from("profiles").insert({ id: user.id, ...profileValues });

  if (result.error) {
    return { error: getDatabaseErrorMessage(result.error, "We could not save your profile.") };
  }

  revalidatePath("/dashboard");
  return { message: "Profile saved." };
}
