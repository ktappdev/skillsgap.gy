import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";
import { getSafeRedirectPath } from "@/lib/validation";
import { redirectAuthenticatedUser } from "@/lib/auth/queries";

export const metadata: Metadata = {
  title: "Create an account",
};

type SignupPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  await redirectAuthenticatedUser();
  const params = await searchParams;
  const nextValue = params.next;
  const next = getSafeRedirectPath(typeof nextValue === "string" ? nextValue : null, "");

  return <AuthForm mode="signup" next={next} />;
}
