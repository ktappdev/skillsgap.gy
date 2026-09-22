import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";
import { getSafeRedirectPath } from "@/lib/validation";
import { redirectAuthenticatedUser } from "@/lib/auth/queries";

export const metadata: Metadata = {
  title: "Sign in",
};

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextValue = params.next;
  const next = getSafeRedirectPath(typeof nextValue === "string" ? nextValue : null, "");
  await redirectAuthenticatedUser(next);

  return <AuthForm mode="login" next={next} />;
}
