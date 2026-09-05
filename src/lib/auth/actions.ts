"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthErrorMessage } from "@/lib/errors";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getFormString, getSafeRedirectPath, getTrimmedFormString } from "@/lib/validation";
import { DEMO_REDIRECTS, getDemoCredentials, parseDemoRole, type DemoRole } from "@/lib/auth/demo";
import { resolveUserHome } from "@/lib/auth/queries";

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
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: getAuthErrorMessage(error) };
  }

  const accountHome = await resolveUserHome(supabase, data.user.id);
  const next = getSafeRedirectPath(getTrimmedFormString(formData, "next"), accountHome);
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

  const next = getSafeRedirectPath(getTrimmedFormString(formData, "next"));
  const callbackUrl = new URL("/auth/callback", env.siteUrl);
  callbackUrl.searchParams.set("next", next);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: callbackUrl.toString(),
      data: {
        ...(fullName ? { full_name: fullName } : {}),
        ...(username ? { username } : {}),
      },
    },
  });

  if (error) {
    return { error: getAuthErrorMessage(error) };
  }

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

export async function requestPasswordReset(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = getTrimmedFormString(formData, "email");
  if (!email || !email.includes("@")) return { error: "Enter a valid email address." };

  const callbackUrl = new URL("/auth/callback", env.siteUrl);
  callbackUrl.searchParams.set("next", "/update-password");
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackUrl.toString(),
  });

  if (error) return { error: getAuthErrorMessage(error) };
  return { message: "If an account exists for that email, a password reset link is on the way." };
}

export async function updatePassword(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = getFormString(formData, "password");
  const confirmation = getFormString(formData, "password_confirmation");
  if (password.length < 8) return { error: "Use a password with at least 8 characters." };
  if (password !== confirmation) return { error: "Those passwords do not match." };

  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult.user) return { error: "This password reset link has expired. Request a new one." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: getAuthErrorMessage(error) };

  const home = await resolveUserHome(supabase, userResult.user.id);
  revalidatePath("/", "layout");
  redirect(home);
}

/**
 * One-click demo login for the testing phase. The browser sends only a role
 * label; credentials are resolved server-side and never returned to the client.
 * Hard-gated by the demoLoginEnabled flag so it is inert in production builds.
 *
 * Each role lands on its own home page (applicant → /dashboard, company roles →
 * /company, admin → /admin). A safe `next` param from the query string still
 * wins when present, so demo users can be deep-linked to a guarded page.
 */
export async function signInAsDemo(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!env.demoLoginEnabled) {
    return { error: "Demo login is not available." };
  }

  const role = parseDemoRole(getFormString(formData, "role"));

  if (!role) {
    return { error: "Choose a valid demo role." };
  }

  const credentials = getDemoCredentials(role);

  if (!credentials) {
    // Deliberately generic: do not reveal which credential is missing.
    return { error: "Demo login is not configured. Ask your operator to run the setup script." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    return { error: getAuthErrorMessage(error) };
  }

  const requestedNext = getTrimmedFormString(formData, "next");
  const next = getSafeRedirectPath(requestedNext || DEMO_REDIRECTS[role]);
  revalidatePath("/", "layout");
  redirect(next);
}

export type { DemoRole };
