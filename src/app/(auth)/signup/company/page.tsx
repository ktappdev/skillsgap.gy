import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Create a company account",
};

export default function CompanySignupPage() {
  return <AuthForm mode="signup" next="/company/request-access" audience="company" />;
}
