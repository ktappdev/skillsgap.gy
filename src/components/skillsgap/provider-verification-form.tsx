"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import {
  saveProviderVerificationDetails,
  type ProviderActionResult,
} from "@/lib/skillsgap/provider-actions";
import type { Tables } from "@/lib/supabase/database.types";

const initialState: ProviderActionResult = {};
const inputClass = "min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal outline-none placeholder:text-muted focus:border-accent";

async function saveVerificationAction(_previousState: ProviderActionResult, formData: FormData): Promise<ProviderActionResult> {
  return saveProviderVerificationDetails(formData);
}

export function ProviderVerificationForm({
  initialDetails,
  isVerified,
}: {
  initialDetails: Tables<"training_provider_verification_details"> | null;
  isVerified: boolean;
}) {
  const [state, formAction] = useActionState(saveVerificationAction, initialState);
  const reviewLabel = isVerified
    ? "Verified"
    : initialDetails?.review_status === "needs_changes"
      ? "Changes requested"
      : initialDetails
        ? "Submitted for review"
        : "Not submitted";

  return (
    <section className="rounded-lg border border-border bg-surface p-5 sm:p-6" aria-labelledby="provider-verification-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Private to you and SkillsGap.gy admins</p>
          <h2 id="provider-verification-heading" className="mt-2 text-xl font-semibold">Organisation verification</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Share your legal registration or accreditation details so an administrator can review your organisation. This information is not shown on public provider listings.</p>
        </div>
        <span className={`inline-flex min-h-9 items-center rounded-md px-3 text-xs font-semibold ${isVerified ? "bg-accent text-white" : "border border-border text-muted"}`}>
          {reviewLabel}
        </span>
      </div>

      <form action={formAction} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-foreground" htmlFor="verification-legal-name">
            Legal organisation name
            <input id="verification-legal-name" name="legal_name" type="text" required maxLength={200} defaultValue={initialDetails?.legal_name ?? ""} className={`mt-2 ${inputClass}`} />
          </label>
          <label className="block text-sm font-semibold text-foreground" htmlFor="verification-registration-number">
            Business or institution registration number <span className="font-normal text-muted">(optional)</span>
            <input id="verification-registration-number" name="registration_number" type="text" maxLength={200} defaultValue={initialDetails?.registration_number ?? ""} className={`mt-2 ${inputClass}`} />
          </label>
          <label className="block text-sm font-semibold text-foreground" htmlFor="verification-accrediting-body">
            Accrediting or recognising body <span className="font-normal text-muted">(optional)</span>
            <input id="verification-accrediting-body" name="accrediting_body" type="text" maxLength={200} defaultValue={initialDetails?.accrediting_body ?? ""} className={`mt-2 ${inputClass}`} />
          </label>
          <label className="block text-sm font-semibold text-foreground" htmlFor="verification-accreditation-reference">
            Accreditation reference <span className="font-normal text-muted">(optional)</span>
            <input id="verification-accreditation-reference" name="accreditation_reference" type="text" maxLength={200} defaultValue={initialDetails?.accreditation_reference ?? ""} className={`mt-2 ${inputClass}`} />
          </label>
        </div>
        <label className="block text-sm font-semibold text-foreground" htmlFor="verification-evidence-url">
          Public evidence link <span className="font-normal text-muted">(optional, HTTPS)</span>
          <input id="verification-evidence-url" name="evidence_url" type="url" maxLength={2048} defaultValue={initialDetails?.evidence_url ?? ""} placeholder="Registration or accreditation page" className={`mt-2 ${inputClass}`} />
        </label>
        <label className="block text-sm font-semibold text-foreground" htmlFor="verification-notes">
          Anything else the reviewer should know <span className="font-normal text-muted">(optional)</span>
          <textarea id="verification-notes" name="notes" rows={3} maxLength={2000} defaultValue={initialDetails?.notes ?? ""} className={`mt-2 py-2 ${inputClass}`} />
        </label>
        {state.error ? <p className="text-sm text-danger" role="alert">{state.error}</p> : null}
        {state.message ? <p className="text-sm text-accent" role="status">{state.message}</p> : null}
        {initialDetails?.review_status === "needs_changes" && initialDetails.review_notes ? <p className="rounded-md border border-border bg-surface-muted p-3 text-sm leading-6 text-muted">Reviewer feedback: {initialDetails.review_notes}</p> : null}
        <SubmitButton pendingLabel="Submitting…" className="min-h-11 rounded-md border border-accent px-5 text-sm font-semibold text-accent hover:bg-surface-muted disabled:cursor-wait disabled:opacity-60">
          {initialDetails ? "Update verification details" : "Submit for verification"}
        </SubmitButton>
        {initialDetails ? <p className="text-xs text-muted">Last submitted {new Date(initialDetails.submitted_at).toLocaleDateString("en-GY", { dateStyle: "medium", timeZone: "America/Guyana" })}.</p> : null}
      </form>
    </section>
  );
}
