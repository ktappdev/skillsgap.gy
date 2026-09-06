"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import { updateProviderProfile, type ProviderActionResult } from "@/lib/skillsgap/provider-actions";

type ProviderProfile = {
  id: string;
  name: string;
  location: string;
  contact_url: string | null;
  contact_phone: string | null;
  description: string | null;
  is_verified: boolean;
};

type ProviderDashboardProps = {
  initialProvider: ProviderProfile;
  programCount: number;
};

const initialState: ProviderActionResult = {};

async function profileAction(
  _previousState: ProviderActionResult,
  formData: FormData,
): Promise<ProviderActionResult> {
  return updateProviderProfile(formData);
}

export function ProviderDashboard({ initialProvider, programCount }: ProviderDashboardProps) {
  const [state, formAction] = useActionState(profileAction, initialState);

  return (
    <section className="mt-8 space-y-5">
      <section className="border border-border bg-surface p-5">
        <p className="text-sm text-muted">Training programs</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{String(programCount)}</p>
      </section>

      <section
        className="border border-border bg-surface p-5 shadow-sm sm:p-6"
        aria-labelledby="provider-profile-heading"
      >
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Profile</p>
        <h2 id="provider-profile-heading" className="mt-2 text-xl font-semibold">
          Edit your provider profile
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Applicants see your name, location, and contact details when browsing training programs.
        </p>

        <div className="mt-4">
          <p className="text-sm font-semibold text-foreground">Verification status</p>
          <p className="mt-1 text-sm leading-6 text-muted">
            {initialProvider.is_verified
              ? "Verified — your programs are eligible for recommendations."
              : "Pending verification — a platform admin reviews new providers before recommending programs. You can still edit your profile and add programs while you wait."}
          </p>
        </div>

        <form action={formAction} className="mt-5 space-y-4">
          <label className="block space-y-2 text-sm font-semibold text-foreground" htmlFor="provider-name">
            Name
            <input
              id="provider-name"
              name="name"
              type="text"
              required
              defaultValue={initialProvider.name}
              className="min-h-11 w-full border border-border bg-surface px-3 text-sm font-normal outline-none transition placeholder:text-muted focus:border-accent"
            />
          </label>

          <label className="block space-y-2 text-sm font-semibold text-foreground" htmlFor="provider-location">
            Location
            <input
              id="provider-location"
              name="location"
              type="text"
              required
              defaultValue={initialProvider.location}
              className="min-h-11 w-full border border-border bg-surface px-3 text-sm font-normal outline-none transition placeholder:text-muted focus:border-accent"
            />
          </label>

          <label
            className="block space-y-2 text-sm font-semibold text-foreground"
            htmlFor="provider-phone"
          >
            Contact phone <span className="font-normal text-muted">(optional)</span>
            <input
              id="provider-phone"
              name="contact_phone"
              type="tel"
              defaultValue={initialProvider.contact_phone ?? ""}
              className="min-h-11 w-full border border-border bg-surface px-3 text-sm font-normal outline-none transition placeholder:text-muted focus:border-accent"
            />
          </label>

          <label className="block space-y-2 text-sm font-semibold text-foreground" htmlFor="provider-url">
            Contact URL <span className="font-normal text-muted">(optional, HTTPS)</span>
            <input
              id="provider-url"
              name="contact_url"
              type="url"
              defaultValue={initialProvider.contact_url ?? ""}
              className="min-h-11 w-full border border-border bg-surface px-3 text-sm font-normal outline-none transition placeholder:text-muted focus:border-accent"
            />
          </label>

          <label
            className="block space-y-2 text-sm font-semibold text-foreground"
            htmlFor="provider-description"
          >
            Description <span className="font-normal text-muted">(optional)</span>
            <textarea
              id="provider-description"
              name="description"
              rows={4}
              defaultValue={initialProvider.description ?? ""}
              className="min-h-11 w-full border border-border bg-surface px-3 py-2 text-sm font-normal outline-none transition placeholder:text-muted focus:border-accent"
            />
          </label>

          {state.error ? <p className="text-sm text-danger" role="alert">{state.error}</p> : null}

          <SubmitButton
            pendingLabel="Saving…"
            className="min-h-11 bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60"
          >
            Save profile
          </SubmitButton>
        </form>
      </section>
    </section>
  );
}
