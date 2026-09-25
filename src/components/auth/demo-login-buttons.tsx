"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import { signInAsDemo, type AuthActionState } from "@/lib/auth/actions";

const demoRoles = [
  { id: "applicant", label: "Applicant", hint: "Browse jobs and skill gaps" },
  { id: "owner", label: "Company Owner", hint: "Manage company and roles" },
  { id: "recruiter", label: "Recruiter", hint: "Review candidates and matches" },
  { id: "provider", label: "Training Provider", hint: "Manage courses and programs" },
] as const;

const initialState: AuthActionState = {};

type DemoLoginButtonsProps = {
  next: string;
};

/**
 * Testing-phase convenience: one-click sign-in for shared demo roles, with
 * password re-entry required for the privileged platform-admin account.
 * Rendered only when NEXT_PUBLIC_DEMO_LOGIN_ENABLED is true.
 */
export function DemoLoginButtons({ next }: DemoLoginButtonsProps) {
  const [state, formAction] = useActionState(signInAsDemo, initialState);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        <span className="h-px flex-1 bg-border" />
        Want to look around first?
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="next" value={next} />
        <div className="grid gap-2 sm:grid-cols-2">
          {demoRoles.map((role) => (
            <SubmitButton
              key={role.id}
              name="role"
              value={role.id}
              pendingLabel="Signing in…"
              className="min-h-11 w-full rounded-md border border-dashed border-border bg-surface px-3.5 py-2 text-left text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-60"
            >
              <span className="flex w-full flex-col items-start gap-0.5">
                <span>{role.label}</span>
                <span className="font-normal text-xs text-muted">{role.hint}</span>
              </span>
            </SubmitButton>
          ))}
        </div>
      </form>

      <form action={formAction} className="rounded-md border border-border bg-surface p-3.5">
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="role" value="admin" />
        <div>
          <p className="text-sm font-semibold text-foreground">Platform Admin</p>
          <p className="mt-0.5 text-xs leading-5 text-muted">Private operator access for managing the demo.</p>
        </div>
        <label className="mt-3 block text-xs font-semibold text-foreground" htmlFor="demo-admin-password">
          Admin password
          <input
            id="demo-admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-2 min-h-11 w-full rounded-md border border-border bg-surface px-3.5 text-sm font-normal outline-none transition focus:border-accent"
          />
        </label>
        <SubmitButton
          pendingLabel="Signing in…"
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-accent px-4 text-sm font-semibold text-accent transition hover:bg-teal-50 disabled:cursor-wait disabled:opacity-60"
        >
          Sign in as admin
        </SubmitButton>
      </form>

      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-danger" role="alert">
          {state.error}
        </p>
      ) : null}

      <p className="text-center text-xs leading-5 text-muted">
        Demo accounts sign in behind the scenes. Not for production use.
      </p>
    </div>
  );
}
