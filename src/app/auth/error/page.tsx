import type { Metadata } from "next";
import Link from "next/link";

import { AuthErrorHandoffScrubber } from "@/components/auth/auth-error-handoff-scrubber";
import { getPathwayHandoffTokenFromReturnPath } from "@/lib/i-want-to-become/pathway-handoff";
import { getSafeRedirectPath } from "@/lib/validation";

export const metadata: Metadata = {
  referrer: "no-referrer",
};

type AuthErrorPageProps = {
  searchParams: Promise<{ next?: string; reason?: string }>;
};

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { next: nextValue, reason } = await searchParams;
  const isRecoveryError = reason === "recovery";
  const next = getSafeRedirectPath(nextValue, "");
  const signInHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";
  const hasPathwayHandoff = getPathwayHandoffTokenFromReturnPath(next) !== null;
  const resetHref = next ? `/forgot-password?next=${encodeURIComponent(next)}` : "/forgot-password";

  return (
    <>
      <AuthErrorHandoffScrubber hasPathwayHandoff={hasPathwayHandoff} />
      <main id="main-content" className="grid min-h-screen place-items-center bg-background px-4 py-12">
        <section className="w-full max-w-md rounded-lg border border-border bg-surface p-6 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {isRecoveryError ? "That reset link expired." : reason === "workspace" ? "We could not load your workspace." : "That link did not work."}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            {isRecoveryError
              ? "Request a fresh reset link and use the newest email."
              : reason === "workspace"
                ? "Refresh and try again. Your account and workspace have not been changed."
                : "The confirmation link may have expired. Start again for a fresh one."}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={isRecoveryError ? resetHref : signInHref}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
            >
              {isRecoveryError ? "Request a new link" : "Return to sign in"}
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              Go home
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
