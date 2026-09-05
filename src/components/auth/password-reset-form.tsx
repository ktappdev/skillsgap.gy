"use client";

import Link from "next/link";
import { useActionState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import { requestPasswordReset, updatePassword, type AuthActionState } from "@/lib/auth/actions";

const initialState: AuthActionState = {};

export function PasswordResetForm({ mode }: { mode: "request" | "update" }) {
  const isUpdate = mode === "update";
  const [state, formAction] = useActionState(isUpdate ? updatePassword : requestPasswordReset, initialState);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Account security</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground">{isUpdate ? "Choose a new password" : "Reset your password"}</h1>
        <p className="mt-3 text-sm leading-6 text-muted">{isUpdate ? "Use at least eight characters and keep it unique to SkillsGap.gy." : "Enter your account email and we will send a secure reset link."}</p>
      </div>
      <form action={formAction} className="space-y-4">
        {isUpdate ? (
          <>
            <PasswordField id="new-password" name="password" label="New password" autoComplete="new-password" />
            <PasswordField id="confirm-password" name="password_confirmation" label="Confirm new password" autoComplete="new-password" />
          </>
        ) : (
          <label className="block space-y-2 text-sm font-semibold text-foreground" htmlFor="reset-email">
            Email
            <input id="reset-email" name="email" type="email" autoComplete="email" required className="min-h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm font-normal outline-none focus:border-accent" />
          </label>
        )}
        {state.error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger" role="alert">{state.error}</p> : null}
        {state.message ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">{state.message}</p> : null}
        <SubmitButton pendingLabel={isUpdate ? "Updating…" : "Sending…"} className="min-h-12 w-full rounded-xl bg-accent px-5 font-semibold text-white hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60">
          {isUpdate ? "Update password" : "Send reset link"}
        </SubmitButton>
      </form>
      {!isUpdate ? <p className="text-center text-sm"><Link href="/login" className="font-semibold text-accent underline-offset-4 hover:underline">Back to sign in</Link></p> : null}
    </div>
  );
}

function PasswordField({ id, name, label, autoComplete }: { id: string; name: string; label: string; autoComplete: "new-password" }) {
  return (
    <label className="block space-y-2 text-sm font-semibold text-foreground" htmlFor={id}>
      {label}
      <input id={id} name={name} type="password" autoComplete={autoComplete} minLength={8} required className="min-h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm font-normal outline-none focus:border-accent" />
    </label>
  );
}
