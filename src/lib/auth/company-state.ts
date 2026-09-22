import { isAuthSessionMissingError } from "@supabase/supabase-js";

import { resolveUserHome } from "@/lib/auth/queries";
import { createClient } from "@/lib/supabase/server";

type CompanySignupState =
  | { kind: "signed-out" | "approved" | "incomplete" | "unavailable" }
  | { kind: "different-account"; email: string | null; home: string };

export async function getCompanySignupState(): Promise<CompanySignupState> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) return { kind: isAuthSessionMissingError(error) ? "signed-out" : "unavailable" };
    if (!data.user) return { kind: "signed-out" };
    const [profile, memberships] = await Promise.all([
      supabase.from("profiles").select("account_type").eq("id", data.user.id).maybeSingle(),
      supabase.from("company_members").select("company_id").eq("user_id", data.user.id),
    ]);
    if (profile.error || memberships.error || !profile.data) {
      return { kind: "unavailable" };
    }
    const companyIds = memberships.data.map((member) => member.company_id);
    const companies = companyIds.length
      ? await supabase.from("companies").select("id,status").in("id", companyIds)
      : { data: [], error: null };
    if (companies.error || !companies.data || companies.data.length !== companyIds.length) return { kind: "unavailable" };
    // Existing memberships remain authoritative, including legacy applicant accounts.
    if (companies.data.some((company) => company.status === "approved")) return { kind: "approved" };
    if (memberships.data.length || profile.data.account_type === "company") return { kind: "incomplete" };
    const home = await resolveUserHome(supabase, data.user.id);
    if (home.startsWith("/auth/error")) return { kind: "unavailable" };
    return { kind: "different-account", email: data.user.email ?? null, home };
  } catch {
    return { kind: "unavailable" };
  }
}
