import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getAccountHome, resolveAccountSpace } from "@/lib/auth/account-space";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export async function resolveUserHome(supabase: SupabaseClient<Database>, userId: string) {
  const [{ data: admin }, { data: memberships }] = await Promise.all([
    supabase.from("platform_admins").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase.from("company_members").select("company_id").eq("user_id", userId),
  ]);

  const companyIds = (memberships ?? []).map((membership) => membership.company_id);
  const { data: companies } = companyIds.length > 0
    ? await supabase.from("companies").select("status").in("id", companyIds)
    : { data: [] };
  return getAccountHome(resolveAccountSpace(Boolean(admin), (companies ?? []).map((company) => company.status)));
}

export async function requireUser(next = "/dashboard") {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  return { supabase, user: data.user };
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
