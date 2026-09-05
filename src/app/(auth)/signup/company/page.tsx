import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";
import { redirectAuthenticatedUser } from "@/lib/auth/queries";

export const metadata: Metadata = {
  title: "Create a company account",
};

export default async function CompanySignupPage() {
  await redirectAuthenticatedUser();
  return <AuthForm mode="signup" next="/company/request-access" audience="company" />;
}
