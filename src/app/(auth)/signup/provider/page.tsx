import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";
import { getProviderSignupNext } from "@/lib/auth/provider-signup";
import { redirectAuthenticatedUser } from "@/lib/auth/queries";

export const metadata: Metadata = {
  title: "Create a training provider account",
};

type ProviderSignupPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProviderSignupPage({ searchParams }: ProviderSignupPageProps) {
  await redirectAuthenticatedUser();
  const params = await searchParams;
  const nextValue = params.next;
  const next = getProviderSignupNext(typeof nextValue === "string" ? nextValue : null);

  return <AuthForm mode="signup" next={next} audience="provider" />;
}
