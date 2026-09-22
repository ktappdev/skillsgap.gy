import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { ProviderAccountBoundary, ProviderSignupUnavailable } from "@/components/auth/provider-account-boundary";
import { getProviderSignupNext } from "@/lib/auth/provider-signup";
import { getProviderSignupState } from "@/lib/auth/queries";

export const metadata: Metadata = {
  title: "Create a training provider account",
};

type ProviderSignupPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProviderSignupPage({ searchParams }: ProviderSignupPageProps) {
  const state = await getProviderSignupState();
  if (state.kind === "existing") redirect("/provider");
  if (state.kind === "incomplete") redirect("/provider/setup");
  if (state.kind === "different-account") {
    return <ProviderAccountBoundary email={state.email} homeHref={state.home} mode="signup" />;
  }
  if (state.kind === "unavailable") return <ProviderSignupUnavailable />;

  const params = await searchParams;
  const nextValue = params.next;
  const next = getProviderSignupNext(typeof nextValue === "string" ? nextValue : null);

  return <AuthForm mode="signup" next={next} audience="provider" />;
}
