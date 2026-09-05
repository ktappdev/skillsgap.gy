import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PasswordResetForm } from "@/components/auth/password-reset-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/auth/error?reason=recovery");
  return <PasswordResetForm mode="update" />;
}
