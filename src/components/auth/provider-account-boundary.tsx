import Link from "next/link";

import { signOutForProviderSignup } from "@/lib/auth/actions";
import { SubmitButton } from "@/components/ui/submit-button";

type ProviderAccountBoundaryProps = {
  email?: string | null;
  homeHref?: string;
  mode: "signup" | "setup";
};

export function ProviderAccountBoundary({ email, homeHref = "/dashboard", mode }: ProviderAccountBoundaryProps) {
  const isSignup = mode === "signup";

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Training provider account</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
          {isSignup ? "Sign out before creating this account" : "Use a training provider account"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          {isSignup
            ? `You are already signed in${email ? ` as ${email}` : ""}. Training providers use a separate account from job seekers and employers, so sign out before registering with a different email address.`
            : "This account is not registered as a training provider. Sign out and use a separate provider account to manage an organisation and its programs."}
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <form action={signOutForProviderSignup} className="flex-1">
          <SubmitButton
            pendingLabel="Signing out…"
            className="min-h-11 w-full rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60"
          >
            Sign out
          </SubmitButton>
        </form>
        <Link href={homeHref} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold text-foreground hover:border-accent hover:text-accent">
          Return to your workspace
        </Link>
      </div>
    </div>
  );
}

export function ProviderSignupUnavailable() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Training provider account</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">We could not load your account</h1>
        <p className="mt-3 text-sm leading-6 text-muted">Refresh and try again. Your account has not been changed.</p>
      </div>
      <Link href="/signup/provider" className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong">
        Try provider signup again
      </Link>
    </div>
  );
}

export function ProviderSetupUnavailable() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Training provider setup</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">We could not load your setup</h1>
        <p className="mt-3 text-sm leading-6 text-muted">Refresh and try again. Your account and provider listing have not been changed.</p>
      </div>
      <Link href="/provider/setup" className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong">
        Try setup again
      </Link>
    </div>
  );
}
