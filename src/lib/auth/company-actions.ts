"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCompanyReturnPath } from "@/lib/auth/company-signup";
import { createClient } from "@/lib/supabase/server";
import { getFormString } from "@/lib/validation";

export async function signOutForCompany(formData: FormData) {
  const next = getCompanyReturnPath(getFormString(formData, "next"));
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  revalidatePath("/", "layout");
  if (error) redirect(`/auth/error?next=${encodeURIComponent(next)}`);
  redirect(next);
}

export async function retryCompanySignup(formData: FormData) {
  const next = getCompanyReturnPath(getFormString(formData, "next"));
  revalidatePath(next);
  redirect(next);
}
