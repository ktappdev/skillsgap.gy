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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {isCompany
            ? isSignUp
              ? "Create your company account"
              : "Sign in"
            : isProvider
              ? isSignUp
                ? "Create your provider account"
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
                ? "Sign up to manage your training programs."
                : "Sign in to manage your training programs."
              : isSignUp
                ? "Start with the experience you already have."
                : "Pick up where you left off."}
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
            No confirmation email needed. You sign in right away.
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
          {isSignUp ? "Create account" : "Sign in"}
        </SubmitButton>
        {!isSignUp ? (
          <p className="text-right text-sm">
            <Link href="/forgot-password" className="inline-flex min-h-11 items-center font-semibold text-accent underline-offset-4 hover:underline">Forgot password?</Link>
          </p>
        ) : null}
      </form>

      <OAuthButtons next={next} />

      {showDemoLogin ? <DemoLoginButtons next={next} /> : null}

      <p className="text-center text-sm text-muted">
        <Link href={switchHref} className="inline-flex min-h-11 items-center font-semibold text-accent underline-offset-4 hover:underline">
          {switchLabel}
        </Link>
      </p>
    </div>
  );
}
