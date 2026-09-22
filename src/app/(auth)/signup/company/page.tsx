import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CompanyAccountBoundary, CompanySignupUnavailable } from "@/components/auth/company-account-boundary";

import { AuthForm } from "@/components/auth/auth-form";
import { getCompanySignupNext } from "@/lib/auth/company-signup";
import { getCompanySignupState } from "@/lib/auth/company-state";

export const metadata: Metadata = {
  title: "Create a company account",
};

type CompanySignupPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CompanySignupPage({ searchParams }: CompanySignupPageProps) {
  const params = await searchParams;
  const nextValue = params.next;
  const next = getCompanySignupNext(typeof nextValue === "string" ? nextValue : null);

  const state = await getCompanySignupState();
  const invitation = next.startsWith("/company/invitations/");
  if (state.kind === "approved") redirect(invitation ? next : "/company");
  if (state.kind === "incomplete") redirect(next);
  if (state.kind === "different-account") {
    return <CompanyAccountBoundary email={state.email} homeHref={state.home} next={invitation ? next : "/signup/company"} />;
  }
  if (state.kind === "unavailable") return <CompanySignupUnavailable next={invitation ? next : "/signup/company"} />;

  return <AuthForm mode="signup" next={next} audience="company" />;
}
