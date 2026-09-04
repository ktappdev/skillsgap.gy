"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthErrorMessage } from "@/lib/errors";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getFormString, getSafeRedirectPath, getTrimmedFormString } from "@/lib/validation";

export type AuthActionState = {
  error?: string;
  message?: string;
};

function validateCredentials(email: string, password: string) {
  if (!email || !email.includes("@")) {
    return "Enter a valid email address.";
  }

  if (!password) {
    return "Enter your password.";
  }

  return null;
}

export async function signIn(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = getTrimmedFormString(formData, "email");
  const password = getFormString(formData, "password");
  const validationError = validateCredentials(email, password);

  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: getAuthErrorMessage(error) };
  }

  const next = getSafeRedirectPath(getTrimmedFormString(formData, "next"));
  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUp(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = getTrimmedFormString(formData, "email");
  const password = getFormString(formData, "password");
  const fullName = getTrimmedFormString(formData, "full_name");
  const username = getTrimmedFormString(formData, "username");
  const validationError = validateCredentials(email, password);

  if (validationError) {
    return { error: validationError };
  }

  if (password.length < 8) {
    return { error: "Use a password with at least 8 characters." };
  }

  if (fullName.length > 80) {
    return { error: "Your name must be 80 characters or fewer." };
  }

  if (username && (username.length < 3 || username.length > 40)) {
    return { error: "Your username must be between 3 and 40 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${env.siteUrl}/auth/callback`,
      data: {
        ...(fullName ? { full_name: fullName } : {}),
        ...(username ? { username } : {}),
      },
    },
  });

  if (error) {
    return { error: getAuthErrorMessage(error) };
  }

  const next = getSafeRedirectPath(getTrimmedFormString(formData, "next"));

  if (data.session) {
    revalidatePath("/", "layout");
    redirect(next);
  }

  return { message: "Check your email to confirm your account, then come back to sign in." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
