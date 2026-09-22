import Link from "next/link";

import { SubmitButton } from "@/components/ui/submit-button";
import { retryCompanySignup, signOutForCompany } from "@/lib/auth/company-actions";

export function CompanyAccountBoundary({ email, homeHref, next = "/signup/company" }: {
  email: string | null;
  homeHref: string;
  next?: string;
}) {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Use a separate company account</h1>
      <p className="text-sm leading-6 text-muted">You are signed in{email ? ` as ${email}` : ""}. Employers and recruiters use a company account separate from job seeker and training provider accounts. Register with a different email address.</p>
      <form action={signOutForCompany}>
        <input type="hidden" name="next" value={next} />
        <SubmitButton pendingLabel="Signing out…" className="min-h-11 w-full rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-strong disabled:opacity-60">Sign out and create a separate company account</SubmitButton>
      </form>
      <Link href={homeHref} className="inline-flex min-h-11 items-center font-semibold text-accent hover:underline">Return to your workspace</Link>
    </div>
  );
}

export function CompanySignupUnavailable({ next = "/signup/company" }: { next?: string }) {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">We could not load your account</h1>
      <p className="text-sm leading-6 text-muted" role="alert">Try again. Your account and company workspace have not been changed.</p>
      <form action={retryCompanySignup}>
        <input type="hidden" name="next" value={next} />
        <SubmitButton pendingLabel="Trying again…" className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong disabled:opacity-60">Try again</SubmitButton>
      </form>
    </div>
  );
}
