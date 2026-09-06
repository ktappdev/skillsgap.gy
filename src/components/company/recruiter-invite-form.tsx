"use client";

import { useActionState, useState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import { createRecruiterInvitation, type RecruiterInviteState } from "@/lib/company/team-actions";

const initialState: RecruiterInviteState = {};

export function RecruiterInviteForm() {
  const [state, formAction] = useActionState(createRecruiterInvitation, initialState);
  const [copied, setCopied] = useState(false);

  async function copyInvitation() {
    if (!state.inviteUrl) return;
    await navigator.clipboard.writeText(state.inviteUrl);
    setCopied(true);
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-5 sm:p-6" aria-labelledby="invite-recruiter-heading">
      <h2 id="invite-recruiter-heading" className="text-xl font-semibold">Invite a recruiter</h2>
      <p className="mt-2 text-sm leading-6 text-muted">Create a private seven-day link. The recruiter signs in with their own account.</p>
      <form action={formAction} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm font-semibold text-foreground" htmlFor="recruiter-email">
          Recruiter email
          <input
            id="recruiter-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="recruiter@company.gy"
            className="mt-2 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal outline-none placeholder:text-muted focus:border-accent"
          />
        </label>
        <SubmitButton
          pendingLabel="Creating…"
          className="min-h-11 rounded-md bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60"
        >
          Create invite
        </SubmitButton>
      </form>
      {state.error ? <p className="mt-4 text-sm text-danger" role="alert">{state.error}</p> : null}
      {state.inviteUrl ? (
        <div className="mt-5 rounded-md border border-accent bg-surface-muted p-4">
          <p className="text-sm font-semibold text-foreground">{state.message}</p>
          <p className="mt-1 text-sm text-muted">For {state.email}</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={state.inviteUrl}
              aria-label="Recruiter invitation link"
              className="min-h-11 min-w-0 flex-1 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
            />
            <button type="button" onClick={() => void copyInvitation()} className="min-h-11 rounded-md border border-accent px-4 text-sm font-semibold text-accent hover:bg-surface">
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
