"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthErrorMessage } from "@/lib/errors";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getFormString, getSafeRedirectPath, getTrimmedFormString } from "@/lib/validation";
import { DEMO_REDIRECTS, getDemoCredentials, parseDemoRole, type DemoRole } from "@/lib/auth/demo";
import { parseAccountType } from "@/lib/auth/account-type";
import { getCompanySignupNext } from "@/lib/auth/company-signup";
import { getProviderSignupNext } from "@/lib/auth/provider-signup";
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

  const accountType = parseAccountType(getTrimmedFormString(formData, "account_type"));
  const requestedNext = getTrimmedFormString(formData, "next");
  const next = accountType === "provider"
    ? getProviderSignupNext(requestedNext)
    : accountType === "company"
      ? getCompanySignupNext(requestedNext)
      : getSafeRedirectPath(requestedNext);
  const callbackUrl = new URL("/auth/callback", env.siteUrl);
  callbackUrl.searchParams.set("next", next);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: callbackUrl.toString(),
      data: {
        account_type: accountType,
        ...(fullName ? { full_name: fullName } : {}),
        ...(username ? { username } : {}),
      },
    },
  });

  if (error) {
    if (accountType === "provider" && getAuthErrorMessage(error).includes("already exists")) {
      return { error: "That email is already linked to an account. Sign in if it is your provider account; otherwise use a different email for this separate workspace." };
    }
    return { error: getAuthErrorMessage(error) };
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect(next);
  }

  return { message: "Account created. Sign in with your email and password to continue." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOutForProviderSignup() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/signup/provider");
}

export async function requestPasswordReset(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = getTrimmedFormString(formData, "email");
  if (!email || !email.includes("@")) return { error: "Enter a valid email address." };

  const requestedNext = getSafeRedirectPath(getTrimmedFormString(formData, "next"), "");
  const updatePasswordUrl = new URL("/update-password", env.siteUrl);
  if (requestedNext) updatePasswordUrl.searchParams.set("next", requestedNext);
  const callbackUrl = new URL("/auth/callback", env.siteUrl);
  callbackUrl.searchParams.set("next", `${updatePasswordUrl.pathname}${updatePasswordUrl.search}`);
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
  const requestedNext = getSafeRedirectPath(getTrimmedFormString(formData, "next"), "");
  if (password.length < 8) return { error: "Use a password with at least 8 characters." };
  if (password !== confirmation) return { error: "Those passwords do not match." };

  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult.user) return { error: "This password reset link has expired. Request a new one." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: getAuthErrorMessage(error) };

  const home = await resolveUserHome(supabase, userResult.user.id);
  revalidatePath("/", "layout");
  redirect(requestedNext || home);
}

/**
 * Demo login for the testing phase. Shared roles resolve their credentials on
 * the server; platform-admin access requires the operator to re-enter the
 * account password. Hard-gated by the demoLoginEnabled flag.
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

  const password = role === "admin"
    ? getFormString(formData, "password")
    : credentials.password;
  if (!password) {
    return { error: "Enter the admin password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password,
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
