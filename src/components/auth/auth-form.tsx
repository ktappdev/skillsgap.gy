"use client";

import Link from "next/link";
import { useActionState } from "react";

import { DemoLoginButtons } from "@/components/auth/demo-login-buttons";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { SubmitButton } from "@/components/ui/submit-button";
import { signIn, signUp, type AuthActionState } from "@/lib/auth/actions";
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

  return (
    <div className="space-y-7">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{isCompany ? "Company access" : isProvider ? "Training provider access" : isSignUp ? "Join the build" : "Welcome back"}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground">
          {isCompany ? (isSignUp ? "Create your company account" : "Sign in to continue") : isProvider ? (isSignUp ? "Create your training provider account" : "Sign in to continue") : isSignUp ? "Start your pathway" : "Return to your pathway"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          {isCompany
            ? "Use your own account to request or join a verified company workspace."
            : isProvider
            ? isSignUp
              ? "Sign up to manage your training programs and help close skills gaps."
              : "Sign in to manage your training programs and help close skills gaps."
            : isSignUp
            ? "Create an applicant account and start with the experience you already have."
            : "Your latest skills, opportunities, and next steps are waiting."}
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />

        {isSignUp ? (
          <>
            <label className="block space-y-2 text-sm font-semibold text-foreground" htmlFor="full_name">
              Name <span className="font-normal text-muted">(optional)</span>
              <input
                id="full_name"
                name="full_name"
                type="text"
                autoComplete="name"
                placeholder="Ken Taylor"
                className="min-h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm font-normal outline-none transition placeholder:text-muted focus:border-accent"
              />
            </label>
            {!isCompany && !isProvider ? <label className="block space-y-2 text-sm font-semibold text-foreground" htmlFor="username">
              Username <span className="font-normal text-muted">(optional)</span>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="your-handle"
                className="min-h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm font-normal outline-none transition placeholder:text-muted focus:border-accent"
              />
            </label> : null}
          </>
        ) : null}

        <label className="block space-y-2 text-sm font-semibold text-foreground" htmlFor="email">
          Email
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            className="min-h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm font-normal outline-none transition placeholder:text-muted focus:border-accent"
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
            className="min-h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm font-normal outline-none transition placeholder:text-muted focus:border-accent"
          />
        </label>

        {isSignUp ? (
          <p className="text-xs leading-5 text-muted">
            This demo signs you in immediately. No confirmation email is required.
          </p>
        ) : null}

        {state.error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-danger" role="alert">
            {state.error}
          </p>
        ) : null}
        {state.message ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm leading-6 text-emerald-800" role="status">
            {state.message}
          </p>
        ) : null}

        <SubmitButton
          pendingLabel={isSignUp ? "Creating account…" : "Signing in…"}
          className="min-h-12 w-full rounded-xl bg-accent px-5 font-semibold text-white shadow-sm transition hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60"
        >
          {isSignUp ? "Create account" : "Sign in"}
        </SubmitButton>
        {!isSignUp ? (
          <p className="text-right text-sm">
            <Link href="/forgot-password" className="font-semibold text-accent underline-offset-4 hover:underline">Forgot password?</Link>
          </p>
        ) : null}
      </form>

      <OAuthButtons next={next} />

      {showDemoLogin ? <DemoLoginButtons next={next} /> : null}

      <p className="text-center text-sm text-muted">
        <Link href={switchHref} className="font-semibold text-accent underline-offset-4 hover:underline">
          {switchLabel}
        </Link>
      </p>
    </div>
  );
}
