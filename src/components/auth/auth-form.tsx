"use client";

import Link from "next/link";
import { useActionState, useLayoutEffect } from "react";

import { CompanySignupGuide } from "@/components/auth/company-signup-guide";
import { DemoLoginButtons } from "@/components/auth/demo-login-buttons";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { ProviderSignupGuide } from "@/components/auth/provider-signup-guide";
import { SignupPitch } from "@/components/auth/signup-pitch";
import { SubmitButton } from "@/components/ui/submit-button";
import { signIn, signUp, type AuthActionState } from "@/lib/auth/actions";
import { getPathwayHandoffTokenFromReturnPath } from "@/lib/i-want-to-become/pathway-handoff";
import { env } from "@/lib/env";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  audience?: "applicant" | "company" | "provider";
  mode: AuthMode;
  next: string;
};

const initialState: AuthActionState = {};

export function AuthForm({ audience = "applicant", mode, next }: AuthFormProps) {
  const isSignUp = mode === "signup";
  const isCompany = audience === "company" || next.startsWith("/company");
  const isProvider = audience === "provider" || next.startsWith("/provider");
  const action = isSignUp ? signUp : signIn;
  const [state, formAction] = useActionState(action, initialState);
  const switchPath = isSignUp ? "/login" : isCompany ? "/signup/company" : isProvider ? "/signup/provider" : "/signup";
  const switchLabel = isSignUp ? "Already have an account? Sign in" : "Need an account? Create one";
  const switchHref = next ? `${switchPath}?next=${encodeURIComponent(next)}` : switchPath;
  const showDemoLogin = !isSignUp && env.demoLoginEnabled;
  const showOAuth = !isSignUp || (!isProvider && !isCompany);
  const showApplicantSignupPitch = isSignUp && audience === "applicant";
  const showProviderSignupGuide = isSignUp && isProvider;
  const accountType = isCompany ? "company" : isProvider ? "provider" : "applicant";
  const hasPathwayHandoff = getPathwayHandoffTokenFromReturnPath(next) !== null;

  useLayoutEffect(() => {
    if (!hasPathwayHandoff) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("next");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, [hasPathwayHandoff]);

  return (
    <div className={showApplicantSignupPitch ? "grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,28rem)] lg:items-stretch" : "mx-auto max-w-md"}>
      {showApplicantSignupPitch ? <SignupPitch /> : null}
      <div className={showApplicantSignupPitch ? "order-1 space-y-6 lg:order-2" : "space-y-6"}>
        {showProviderSignupGuide ? <ProviderSignupGuide /> : null}
        {isSignUp && isCompany ? <CompanySignupGuide /> : null}
        <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {isCompany
            ? isSignUp
              ? "Create your company account"
              : "Sign in"
            : isProvider
              ? isSignUp
                ? "Create your training provider account"
                : "Sign in"
              : isSignUp
                ? "Create an account"
                : "Sign in"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          {isCompany
            ? "Use your own account to request or join a verified company workspace."
            : isProvider
              ? isSignUp
                ? "Create a separate account for your organisation, then add your training programs."
                : "Sign in to manage your training programs."
                : isSignUp
                  ? "Start with the experience you already have."
                  : "Pick up where you left off."}
        </p>
        {next ? <p className="mt-2 text-xs leading-5 text-muted">You’ll return to the page you started from after you sign in.</p> : null}
        </div>

        <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        {isSignUp ? <input type="hidden" name="account_type" value={accountType} /> : null}

        {isSignUp ? (
          <>
            <label className="block space-y-2 text-sm font-semibold text-foreground" htmlFor="full_name">
              {isProvider ? "Contact name" : "Name"} <span className="font-normal text-muted">(optional)</span>
              <input
                id="full_name"
                name="full_name"
                type="text"
                autoComplete="name"
                placeholder={isProvider ? "Training coordinator" : "Ken Taylor"}
                className="min-h-11 w-full rounded-md border border-border bg-surface px-3.5 text-sm font-normal outline-none transition placeholder:text-muted focus:border-accent"
              />
            </label>
            {!isCompany && !isProvider ? (
              <label className="block space-y-2 text-sm font-semibold text-foreground" htmlFor="username">
                Username <span className="font-normal text-muted">(optional)</span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  spellCheck={false}
                  placeholder="your-handle"
                  className="min-h-11 w-full rounded-md border border-border bg-surface px-3.5 text-sm font-normal outline-none transition placeholder:text-muted focus:border-accent"
                />
              </label>
            ) : null}
          </>
        ) : null}

        <label className="block space-y-2 text-sm font-semibold text-foreground" htmlFor="email">
          Email
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            placeholder="you@example.com"
            required
            className="min-h-11 w-full rounded-md border border-border bg-surface px-3.5 text-sm font-normal outline-none transition placeholder:text-muted focus:border-accent"
          />
        </label>

        <label className="block space-y-2 text-sm font-semibold text-foreground" htmlFor="password">
          Password
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            placeholder={isSignUp ? "At least 8 characters" : "Your password"}
            required
            className="min-h-11 w-full rounded-md border border-border bg-surface px-3.5 text-sm font-normal outline-none transition placeholder:text-muted focus:border-accent"
          />
        </label>

        {isSignUp ? (
          <p className="text-xs leading-5 text-muted">
            If email confirmation is required, open the link to return here and continue.
          </p>
        ) : null}

        {state.error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-danger" role="alert">
            {state.error}
          </p>
        ) : null}
        {state.message ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm leading-6 text-emerald-800" role="status">
            {state.message}
          </p>
        ) : null}

        <SubmitButton
          pendingLabel={isSignUp ? "Creating account…" : "Signing in…"}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-5 font-semibold text-white transition hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60"
        >
          {isSignUp ? (isProvider ? "Create training provider account" : isCompany ? "Create company account" : "Create account") : "Sign in"}
        </SubmitButton>
        {!isSignUp ? (
          <p className="text-right text-sm">
            <Link href={next ? `/forgot-password?next=${encodeURIComponent(next)}` : "/forgot-password"} className="inline-flex min-h-11 items-center font-semibold text-accent underline-offset-4 hover:underline">Forgot password?</Link>
          </p>
        ) : null}
        </form>

        {showOAuth ? <OAuthButtons next={next} /> : null}

        {showDemoLogin ? <DemoLoginButtons next={next} /> : null}

        <p className="text-center text-sm text-muted">
          <Link href={switchHref} className="inline-flex min-h-11 items-center font-semibold text-accent underline-offset-4 hover:underline">
            {switchLabel}
          </Link>
        </p>

        {audience === "applicant" ? <div className="border-t border-border pt-5 text-center text-sm text-muted">
          <p>Creating a workspace instead?</p>
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-2">
            <Link href="/signup/company" className="font-semibold text-accent underline-offset-4 hover:underline">Company account</Link>
            <Link href="/signup/provider" className="font-semibold text-accent underline-offset-4 hover:underline">Training provider account</Link>
          </div>
        </div> : null}
      </div>
    </div>
  );
}
