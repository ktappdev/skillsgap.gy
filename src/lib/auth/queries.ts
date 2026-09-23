import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getAccountHome, resolveAccountSpace } from "@/lib/auth/account-space";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { getSafeRedirectPath } from "@/lib/validation";

export async function resolveUserHome(supabase: SupabaseClient<Database>, userId: string) {
  const [adminResult, membershipsResult, providerResult, profileResult] = await Promise.all([
    supabase.from("platform_admins").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase.from("company_members").select("company_id").eq("user_id", userId),
    supabase.from("training_providers").select("id").eq("owner_user_id", userId).maybeSingle(),
    supabase.from("profiles").select("account_type").eq("id", userId).maybeSingle(),
  ]);

  if (adminResult.error || membershipsResult.error || providerResult.error || profileResult.error || !profileResult.data) {
    return "/auth/error?reason=workspace";
  }

  const companyIds = (membershipsResult.data ?? []).map((membership) => membership.company_id);
  const companiesResult = companyIds.length > 0
    ? await supabase.from("companies").select("status").in("id", companyIds)
    : { data: [], error: null };
  if (companiesResult.error) return "/auth/error?reason=workspace";
  return getAccountHome(
    resolveAccountSpace(
      Boolean(adminResult.data),
      (companiesResult.data ?? []).map((company) => company.status),
      Boolean(providerResult.data),
      profileResult.data.account_type === "provider",
      profileResult.data.account_type === "company",
    ),
  );
}

export type ProviderSignupState =
  | { kind: "signed-out" }
  | { kind: "incomplete" }
  | { kind: "existing" }
  | { kind: "different-account"; email: string | null; home: string }
  | { kind: "unavailable" };

export async function getProviderSignupState(): Promise<ProviderSignupState> {
  const supabase = await createClient();
  const { data: userResult, error: userError } = await supabase.auth.getUser();

  if (userError || !userResult.user) return { kind: "signed-out" };

  const [{ data: profile, error: profileError }, { data: provider, error: providerError }] = await Promise.all([
    supabase.from("profiles").select("account_type").eq("id", userResult.user.id).maybeSingle(),
    supabase.from("training_providers").select("id").eq("owner_user_id", userResult.user.id).maybeSingle(),
  ]);

  if (profileError || providerError || !profile) return { kind: "unavailable" };
  if (provider) return { kind: "existing" };
  if (profile.account_type === "provider") return { kind: "incomplete" };

  return {
    kind: "different-account",
    email: userResult.user.email ?? null,
    home: await resolveUserHome(supabase, userResult.user.id),
  };
}

export async function requireUser(next = "/dashboard") {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  return { supabase, user: data.user };
}

export async function redirectAuthenticatedUser(next = "") {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    const home = await resolveUserHome(supabase, data.user.id);
    redirect(getSafeRedirectPath(next, home));
  }
}

export async function requireApplicant() {
  const context = await requireUser();
  const accountHome = await resolveUserHome(context.supabase, context.user.id);
  if (accountHome !== "/dashboard") redirect(accountHome);
  return context;
}

export async function requirePlatformAdmin() {
  const context = await requireUser();
  const { data: admin } = await context.supabase.from("platform_admins").select("user_id").eq("user_id", context.user.id).maybeSingle();
  if (!admin) redirect(await resolveUserHome(context.supabase, context.user.id));
  return context;
}

export async function requireApprovedCompanyMember() {
  const context = await requireUser();
  const { data: membership } = await context.supabase.from("company_members").select("company_id,role,companies!inner(status)").eq("user_id", context.user.id).eq("companies.status", "approved").limit(1).maybeSingle();
  if (!membership) redirect(await resolveUserHome(context.supabase, context.user.id));
  return { ...context, companyId: membership.company_id, companyRole: membership.role };
}

export async function requireApprovedCompanyOwner() {
  const context = await requireApprovedCompanyMember();
  if (context.companyRole !== "owner") redirect("/company/team");
  return context;
}

export async function requireTrainingProvider(next = "/provider") {
  const context = await requireUser(next);
  const { data: provider, error } = await context.supabase
    .from("training_providers")
    .select("id, name, provider_type, location, physical_address, service_area, contact_email, contact_url, contact_phone, description, is_verified")
    .eq("owner_user_id", context.user.id)
    .maybeSingle();
  if (error) redirect(`/auth/error?reason=workspace&next=${encodeURIComponent(next)}`);
  if (!provider) redirect(await resolveUserHome(context.supabase, context.user.id));
  return { ...context, provider };
}
