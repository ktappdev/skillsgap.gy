import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";
import { getSafeRedirectPath } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Create an account",
};

type SignupPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const nextValue = params.next;
  const next = getSafeRedirectPath(typeof nextValue === "string" ? nextValue : null);

  return <AuthForm mode="signup" next={next} />;
}
