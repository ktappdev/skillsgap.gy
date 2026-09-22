import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PasswordResetForm } from "@/components/auth/password-reset-form";
import { createClient } from "@/lib/supabase/server";
import { getSafeRedirectPath } from "@/lib/validation";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function UpdatePasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const nextValue = params.next;
  const next = getSafeRedirectPath(typeof nextValue === "string" ? nextValue : null, "");
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    redirect(next ? `/auth/error?reason=recovery&next=${encodeURIComponent(next)}` : "/auth/error?reason=recovery");
  }
  return <PasswordResetForm mode="update" next={next} />;
}
