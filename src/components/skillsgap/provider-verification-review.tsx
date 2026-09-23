"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import { reviewTrainingProvider } from "@/lib/skillsgap/actions";
import type { Tables } from "@/lib/supabase/database.types";
import { getProviderTypeLabel } from "@/lib/training";

type Provider = Tables<"training_providers">;
type VerificationDetails = Tables<"training_provider_verification_details">;
type ReviewState = { error?: string; message?: string };

const initialState: ReviewState = {};

async function reviewAction(_previousState: ReviewState, formData: FormData): Promise<ReviewState> {
  return reviewTrainingProvider(formData);
}

export function ProviderVerificationReview({
  providers,
  verificationDetails,
}: {
  providers: Provider[];
  verificationDetails: VerificationDetails[];
}) {
  const [state, formAction] = useActionState(reviewAction, initialState);
  const detailsByProviderId = new Map(verificationDetails.map((details) => [details.provider_id, details]));

  return (
    <section className="rounded-lg border border-border bg-surface p-5 sm:p-6" aria-labelledby="provider-review-title">
      <h2 id="provider-review-title" className="text-xl font-semibold">Provider verification</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Review private registration or accreditation information here. Verified status makes a provider’s active, qualification-mapped programs visible to learners.</p>
      {state.error ? <p className="mt-3 text-sm text-danger" role="alert">{state.error}</p> : null}
      {state.message ? <p className="mt-3 text-sm text-muted" role="status">{state.message}</p> : null}
      {providers.length === 0 ? <p className="mt-4 text-sm text-muted">No provider records yet.</p> : (
        <ul className="mt-4 space-y-3">
          {providers.map((provider) => {
            const details = detailsByProviderId.get(provider.id);
            const hasEvidence = Boolean(details?.evidence_url || details?.registration_number || (details?.accrediting_body && details.accreditation_reference));
            const cannotVerify = !provider.is_verified && provider.owner_user_id !== null && !hasEvidence;
            return (
              <li key={provider.id} className="rounded-md border border-border bg-surface-muted p-4">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-foreground">{provider.name}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${provider.is_verified ? "bg-accent text-white" : "border border-border text-muted"}`}>
                        {provider.is_verified ? "Verified" : details?.review_status === "needs_changes" ? "Changes requested" : details ? "Review submitted" : "Not submitted"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted">{provider.location} · {getProviderTypeLabel(provider.provider_type)}</p>
                    {details ? (
                      <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                        <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">Legal name</dt><dd className="mt-1 text-foreground">{details.legal_name}</dd></div>
                        {details.registration_number ? <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">Registration number</dt><dd className="mt-1 text-foreground">{details.registration_number}</dd></div> : null}
                        {details.accrediting_body ? <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">Accrediting body</dt><dd className="mt-1 text-foreground">{details.accrediting_body}</dd></div> : null}
                        {details.accreditation_reference ? <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">Accreditation reference</dt><dd className="mt-1 text-foreground">{details.accreditation_reference}</dd></div> : null}
                        {details.notes ? <div className="sm:col-span-2"><dt className="text-xs font-semibold uppercase tracking-wide text-muted">Provider notes</dt><dd className="mt-1 whitespace-pre-line text-foreground">{details.notes}</dd></div> : null}
                      </dl>
                    ) : null}
                    {details?.evidence_url ? <a href={details.evidence_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline">Review evidence <span aria-hidden="true" className="ml-1">↗</span></a> : null}
                    {details?.review_notes ? <p className="mt-2 text-sm text-muted">Previous review: {details.review_notes}</p> : null}
                    {cannotVerify ? <p className="mt-2 text-sm text-muted">Registration or accreditation evidence is required before approval.</p> : null}
                  </div>
                  <form key={`${provider.id}-${details?.submitted_at ?? "new"}-${details?.reviewed_at ?? "unreviewed"}`} action={formAction} className="w-full space-y-3 sm:max-w-64">
                    <input type="hidden" name="providerId" value={provider.id} />
                    <label className="block text-sm font-semibold text-foreground" htmlFor={`review-notes-${provider.id}`}>
                      Reviewer note <span className="font-normal text-muted">(optional)</span>
                      <textarea id={`review-notes-${provider.id}`} name="reviewNotes" rows={3} maxLength={2000} defaultValue={details?.review_notes ?? ""} className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm font-normal outline-none focus:border-accent" />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {!provider.is_verified ? <SubmitButton name="decision" value="approve" pendingLabel="Reviewing…" disabled={cannotVerify} className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50">Approve</SubmitButton> : null}
                      {details || provider.is_verified ? <SubmitButton name="decision" value="needs_changes" pendingLabel="Reviewing…" className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-foreground hover:bg-surface disabled:cursor-wait disabled:opacity-60">{provider.is_verified ? "Revoke verification" : "Request changes"}</SubmitButton> : null}
                    </div>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
