"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import { submitCompanyAccess } from "@/lib/company/access-request-actions";
import type { CompanyRequestValues } from "@/lib/company/access-request-state";

export function CompanyRequestForm({ mode = "request", initialValues = { name: "", website: "", description: "" }, pendingLabel = "Sending request…", submitLabel = "Request access" }: { mode?: "request" | "resubmit"; initialValues?: CompanyRequestValues; pendingLabel?: string; submitLabel?: string }) {
  const [state, action, pending] = useActionState(submitCompanyAccess.bind(null, mode), { values: initialValues });
  const errorId = "company-request-error";
  return (
    <form action={action} className="mt-6 space-y-4" aria-busy={pending} aria-describedby={state.error ? errorId : undefined}>
      <Field label="Company name" name="company" defaultValue={state.values.name} invalid={state.invalidField === "name"} />
      <Field label="Company website (optional)" name="website" type="url" defaultValue={state.values.website} invalid={state.invalidField === "website"} />
      <label className="block text-sm font-semibold text-foreground" htmlFor="company-description">
        What work do you do?
        <textarea id="company-description" name="description" defaultValue={state.values.description} aria-invalid={state.invalidField === "description" || undefined} aria-describedby={state.invalidField === "description" ? errorId : undefined} maxLength={2000} rows={4} className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm font-normal outline-none focus:border-accent" />
      </label>
      {state.error ? <p id={errorId} className="text-sm text-danger" role="alert">{state.error}</p> : null}
      <SubmitButton pendingLabel={pendingLabel} className="min-h-11 w-full rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}

function Field({ label, name, type = "text", defaultValue, invalid }: { label: string; name: string; type?: "text" | "url"; defaultValue: string; invalid: boolean }) {
  const id = `company-${name}`;
  return (
    <label className="block text-sm font-semibold text-foreground" htmlFor={id}>
      {label}
      <input id={id} required={name === "company"} defaultValue={defaultValue} aria-invalid={invalid || undefined} aria-describedby={invalid ? "company-request-error" : undefined} maxLength={name === "company" ? 160 : 2048} name={name} type={type} className="mt-2 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal outline-none focus:border-accent" />
    </label>
  );
}
