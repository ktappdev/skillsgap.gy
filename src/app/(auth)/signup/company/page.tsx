import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";
import { getCompanySignupNext } from "@/lib/auth/company-signup";
import { redirectAuthenticatedUser } from "@/lib/auth/queries";

export const metadata: Metadata = {
  title: "Create a company account",
};

type CompanySignupPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CompanySignupPage({ searchParams }: CompanySignupPageProps) {
  await redirectAuthenticatedUser();
  const params = await searchParams;
  const nextValue = params.next;
  const next = getCompanySignupNext(typeof nextValue === "string" ? nextValue : null);

  return <AuthForm mode="signup" next={next} audience="company" />;
}
