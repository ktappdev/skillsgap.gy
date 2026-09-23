"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";

import { requireUser } from "@/lib/auth/queries";
import { validateCompanyProfile } from "@/lib/company/company-profile";
import { getFormString } from "@/lib/validation";
import type { CompanyRequestState } from "@/lib/company/access-request-state";

export async function submitCompanyAccess(mode: "request" | "resubmit", _previous: CompanyRequestState, formData: FormData): Promise<CompanyRequestState> {
  const values = {
    name: getFormString(formData, "company"),
    website: getFormString(formData, "website"),
    industry: getFormString(formData, "industry"),
    location: getFormString(formData, "location"),
    contactPhone: getFormString(formData, "contact_phone"),
    description: getFormString(formData, "description"),
  };
  const fail = (error: string, invalidField?: CompanyRequestState["invalidField"]): CompanyRequestState => ({ values, error, invalidField });
  const unavailable = () => fail("We could not save your request. Your details are still here; please try again.");
  try {
    const { supabase, user } = await requireUser("/company/request-access");
    const membershipQuery = () => supabase.from("company_members").select("company_id").eq("user_id", user.id).maybeSingle();
    const membership = await membershipQuery();
    if (membership.error) return unavailable();
    const company = membership.data
      ? await supabase.from("companies").select("id,status,requested_by").eq("id", membership.data.company_id).maybeSingle()
      : null;
    if (company?.error || (membership.data && !company?.data)) return unavailable();
    if (company?.data?.status === "approved") redirect("/company");
    if (company?.data?.status === "pending") redirect("/company/request-access?submitted=1");
    if (mode === "request" && company?.data) redirect("/company/request-access");

    if (!company?.data) {
      const profile = await supabase.from("profiles").select("account_type").eq("id", user.id).maybeSingle();
      if (profile.error || !profile.data) return unavailable();
      if (profile.data.account_type !== "company") redirect("/signup/company");
    }
    if (mode === "resubmit" && (!company?.data || company.data.requested_by !== user.id)) {
      return fail("This company request is no longer available. Refresh and try again.");
    }
    const check = validateCompanyProfile(values);
    if (check.error || !check.values) {
      const invalidField = check.error?.includes("website")
        ? "website"
        : check.error?.includes("industry")
          ? "industry"
          : check.error?.includes("operating location")
            ? "location"
            : check.error?.includes("contact phone")
              ? "contactPhone"
              : check.error?.includes("description")
                ? "description"
                : "name";
      return fail(check.error ?? "Check the company details and try again.", invalidField);
    }

    const details = { ...check.values, requested_by: user.id, status: "pending" as const };
    const result = mode === "resubmit" && company?.data
      ? await supabase.from("companies").update({ ...details, reviewed_by: null, reviewed_at: null }).eq("id", company.data.id).eq("status", "rejected").eq("requested_by", user.id)
      : await supabase.from("companies").insert(details);
    if (result.error) {
      // The one-company membership constraint serializes competing inserts. A
      // successful concurrent request is the same outcome as this submission.
      const current = await membershipQuery();
      if (current.error) return unavailable();
      if (current.data && mode === "request") redirect("/company/request-access");
      if (result.error.code === "23505") return fail("A company with this name already exists. An administrator must handle access to an existing listing; it cannot be claimed automatically.");
      return unavailable();
    }
    revalidatePath("/admin/companies");
    revalidatePath("/company/request-access");
    redirect("/company/request-access?submitted=1");
  } catch (error) {
    unstable_rethrow(error);
    return unavailable();
  }
}
