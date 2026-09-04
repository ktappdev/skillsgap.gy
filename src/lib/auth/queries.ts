import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function requireUser(next = "/dashboard") {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  return { supabase, user: data.user };
}

export async function requirePlatformAdmin() {
  const context = await requireUser();
  const { data: admin } = await context.supabase.from("platform_admins").select("user_id").eq("user_id", context.user.id).maybeSingle();
  if (!admin) redirect("/dashboard");
  return context;
}

export async function requireApprovedCompanyMember() {
  const context = await requireUser();
  const { data: membership } = await context.supabase.from("company_members").select("company_id,companies!inner(status)").eq("user_id", context.user.id).eq("companies.status", "approved").limit(1).maybeSingle();
  if (!membership) redirect("/company/request-access");
  return { ...context, companyId: membership.company_id };
}
