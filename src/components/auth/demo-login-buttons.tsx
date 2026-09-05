"use client";

import { useActionState } from "react";

import { signInAsDemo, type AuthActionState } from "@/lib/auth/actions";

const demoRoles = [
  { id: "applicant", label: "Applicant", hint: "Browse jobs and skill gaps" },
  { id: "owner", label: "Company Owner", hint: "Manage company and roles" },
  { id: "recruiter", label: "Recruiter", hint: "Review candidates and matches" },
  { id: "admin", label: "Platform Admin", hint: "Oversee the platform" },
] as const;

const initialState: AuthActionState = {};

type DemoLoginButtonsProps = {
  next: string;
};

/**
 * Testing-phase convenience: one-click sign-in per stakeholder role.
 * The browser only sends a role label; credentials stay server-side.
 * Rendered only when NEXT_PUBLIC_DEMO_LOGIN_ENABLED is true.
 */
export function DemoLoginButtons({ next }: DemoLoginButtonsProps) {
  const [state, formAction] = useActionState(signInAsDemo, initialState);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        <span className="h-px flex-1 bg-border" />
        Demo access
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="next" value={next} />
        <div className="grid gap-2 sm:grid-cols-2">
          {demoRoles.map((role) => (
            <button
              key={role.id}
              type="submit"
              name="role"
              value={role.id}
              className="flex min-h-11 flex-col items-start gap-0.5 rounded-xl border border-border bg-surface px-3.5 py-2 text-left text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent"
            >
              <span>{role.label}</span>
              <span className="font-normal text-xs text-muted">{role.hint}</span>
            </button>
          ))}
        </div>
      </form>

      {state.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-danger" role="alert">
          {state.error}
        </p>
      ) : null}

      <p className="text-center text-xs leading-5 text-muted">
        Testing accounts for the hackathon preview. Do not use in production.
      </p>
    </div>
  );
}
