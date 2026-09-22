import type { Metadata } from "next";

import { PasswordResetForm } from "@/components/auth/password-reset-form";
import { getSafeRedirectPath } from "@/lib/validation";

export const metadata: Metadata = { title: "Reset password" };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const nextValue = params.next;
  const next = getSafeRedirectPath(typeof nextValue === "string" ? nextValue : null, "");
  return <PasswordResetForm mode="request" next={next} />;
}
