"use server";

import { revalidatePath } from "next/cache";

import { requireApprovedCompanyOwner } from "@/lib/auth/queries";
import { getDatabaseErrorMessage } from "@/lib/errors";
import { companyValuesToFormValues, validateCompanyProfile, type CompanyProfileFormValues } from "@/lib/company/company-profile";
import { getFormString } from "@/lib/validation";

export type CompanyProfileActionState = {
  values: CompanyProfileFormValues;
  error?: string;
  message?: string;
};

export async function updateCompanyProfile(_previous: CompanyProfileActionState, formData: FormData): Promise<CompanyProfileActionState> {
  const values: CompanyProfileFormValues = {
    name: getFormString(formData, "name"),
    website: getFormString(formData, "website"),
    industry: getFormString(formData, "industry"),
    location: getFormString(formData, "location"),
    contactPhone: getFormString(formData, "contact_phone"),
    description: getFormString(formData, "description"),
  };
  const check = validateCompanyProfile(values);
  if (check.error || !check.values) return { values, error: check.error ?? "Check the company details and try again." };

  const { supabase, companyId } = await requireApprovedCompanyOwner();
  const { error } = await supabase.from("companies").update(check.values).eq("id", companyId);
  if (error) {
    return { values, error: getDatabaseErrorMessage(error, "We could not save your company profile. Please try again.") };
  }

  revalidatePath("/company");
  revalidatePath("/company/jobs");
  revalidatePath("/opportunities");
  return { values: companyValuesToFormValues(check.values), message: "Company profile saved." };
}
