"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import {
  reviewProviderQualification,
  type ProviderActionResult,
} from "@/lib/skillsgap/provider-actions";
import type { Tables } from "@/lib/supabase/database.types";

type ProviderQualificationSuggestion = {
  qualification: Tables<"qualifications">;
  provider: Pick<Tables<"training_providers">, "id" | "name"> | null;
  programs: Pick<Tables<"training_programs">, "id" | "name">[];
};

const initialState: ProviderActionResult = {};

async function reviewAction(
  _previousState: ProviderActionResult,
  formData: FormData,
): Promise<ProviderActionResult> {
  return reviewProviderQualification(formData);
}

export function ProviderQualificationReview({
  suggestions,
}: {
  suggestions: ProviderQualificationSuggestion[];
}) {
  const [state, formAction] = useActionState(reviewAction, initialState);

  return (
    <section className="mt-6 rounded-lg border border-border bg-surface p-5 sm:p-6" aria-labelledby="provider-qualification-review-title">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Provider submissions</p>
        <h2 id="provider-qualification-review-title" className="mt-2 text-xl font-semibold">Qualification suggestions</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Review provider wording before it enters the matching taxonomy. Approved suggestions become usable outcomes for the provider’s mapped programs.
        </p>
      </div>

      {state.error ? <p className="mt-4 text-sm text-danger" role="alert">{state.error}</p> : null}
      {state.message ? <p className="mt-4 text-sm text-accent" role="status">{state.message}</p> : null}

      {suggestions.length === 0 ? (
        <p className="mt-4 rounded-md border border-dashed border-border p-4 text-sm text-muted">No provider qualification suggestions are waiting for review.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {suggestions.map(({ qualification, provider, programs }) => (
            <li key={qualification.id} className="rounded-md border border-border bg-surface-muted p-4">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground">{qualification.name}</h3>
                  <p className="mt-1 text-sm text-muted">{qualification.category.replaceAll("_", " ")} · {qualification.slug}</p>
                  {qualification.description ? <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted">{qualification.description}</p> : null}
                  <p className="mt-2 text-sm text-foreground">Suggested by {provider?.name ?? "Provider account unavailable"}</p>
                  <p className="mt-1 text-sm text-muted">Mapped programs: {programs.map((program) => program.name).join(", ") || "None"}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <form action={formAction}>
                    <input type="hidden" name="qualificationId" value={qualification.id} />
                    <input type="hidden" name="decision" value="reject" />
                    <SubmitButton pendingLabel="Reviewing…" className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-foreground hover:bg-surface disabled:cursor-wait disabled:opacity-60">
                      Decline
                    </SubmitButton>
                  </form>
                  <form action={formAction}>
                    <input type="hidden" name="qualificationId" value={qualification.id} />
                    <input type="hidden" name="decision" value="approve" />
                    <SubmitButton pendingLabel="Reviewing…" className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60">
                      Approve
                    </SubmitButton>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
