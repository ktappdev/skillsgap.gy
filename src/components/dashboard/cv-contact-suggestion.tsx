"use client";

import { useActionState } from "react";

import { applyContactSuggestion, dismissContactSuggestion, type ProfileActionState } from "@/lib/profile/actions";
import type { Tables } from "@/lib/supabase/database.types";

const initialState: ProfileActionState = {};

type CvContactSuggestionProps = {
  suggestion: Tables<"applicant_contact_suggestions">;
};

export function CvContactSuggestion({ suggestion }: CvContactSuggestionProps) {
  const [applyState, applyAction, isApplying] = useActionState(applyContactSuggestion, initialState);
  const [dismissState, dismissAction, isDismissing] = useActionState(dismissContactSuggestion, initialState);
  const isPending = isApplying || isDismissing;

  return (
    <section className="rounded-md border border-accent/30 bg-teal-50/50 p-4" aria-labelledby="cv-contact-suggestion-title">
      <h3 id="cv-contact-suggestion-title" className="text-sm font-semibold text-foreground">Contact details found in your CV</h3>
      <p className="mt-1 text-sm leading-5 text-muted">Review the values and page evidence. Choosing “Use these details” replaces the matching fields currently saved below.</p>

      <ul className="mt-3 space-y-3">
        <SuggestedField label="Full name" value={suggestion.full_name} evidence={suggestion.full_name_evidence} page={suggestion.full_name_evidence_page} />
        <SuggestedField label="Contact email" value={suggestion.contact_email} evidence={suggestion.contact_email_evidence} page={suggestion.contact_email_evidence_page} />
        <SuggestedField label="Phone number" value={suggestion.phone_number} evidence={suggestion.phone_number_evidence} page={suggestion.phone_number_evidence_page} />
      </ul>

      {applyState.error || dismissState.error ? <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger" role="alert">{applyState.error ?? dismissState.error}</p> : null}
      {applyState.message || dismissState.message ? <p className="mt-3 text-sm text-emerald-800" role="status">{applyState.message ?? dismissState.message}</p> : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <form action={applyAction}>
          <input type="hidden" name="suggestion_id" value={suggestion.id} />
          <button type="submit" disabled={isPending} className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60">
            {isApplying ? "Saving…" : "Use these details"}
          </button>
        </form>
        <form action={dismissAction}>
          <input type="hidden" name="suggestion_id" value={suggestion.id} />
          <button type="submit" disabled={isPending} className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold text-foreground hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60">
            {isDismissing ? "Dismissing…" : "Dismiss"}
          </button>
        </form>
      </div>
    </section>
  );
}

function SuggestedField({ label, value, evidence, page }: { label: string; value: string | null; evidence: string | null; page: number | null }) {
  if (!value) return null;

  return (
    <li className="border-t border-accent/15 pt-3 first:border-0 first:pt-0">
      <p className="text-sm font-semibold text-foreground">{label}: <span className="font-normal">{value}</span></p>
      <p className="mt-1 text-xs leading-5 text-muted">CV page {page ?? "unavailable"}{evidence ? ` · “${evidence}”` : " · Source excerpt unavailable"}</p>
    </li>
  );
}
