"use client";

import Link from "next/link";
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

const fieldClass = "min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal outline-none placeholder:text-muted focus:border-accent";

export function ProviderDashboard({ initialProvider, programCount }: ProviderDashboardProps) {
  const [state, formAction] = useActionState(profileAction, initialState);

  return (
    <section className="mt-6 space-y-6" aria-label="Provider overview">
      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-5">
          <dt className="text-sm text-muted">Training programs</dt>
          <dd className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{String(programCount)}</dd>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <dt className="text-sm text-muted">Verification</dt>
          <dd className="mt-2 text-sm font-semibold text-foreground">{initialProvider.is_verified ? "Verified" : "Pending verification"}</dd>
          <dd className="mt-1 text-sm leading-6 text-muted">{initialProvider.is_verified ? "Your programs are eligible for recommendations." : "An admin reviews new providers. You can still edit and add programs while you wait."}</dd>
        </div>
      </dl>

      {programCount === 0 ? (
        <section className="rounded-lg border border-accent bg-surface-muted p-5 sm:p-6" aria-labelledby="first-program-heading">
          <h2 id="first-program-heading" className="text-xl font-semibold">Add your first program</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Add a course or certification and map it to the skills or qualifications it supports. Applicants can find it after your provider is verified.</p>
          <Link href="/provider/programs#create-program-heading" className="mt-4 inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong">Add a training program</Link>
        </section>
      ) : null}

      <section
        className="rounded-lg border border-border bg-surface p-5 sm:p-6"
        aria-labelledby="provider-profile-heading"
      >
        <h2 id="provider-profile-heading" className="text-xl font-semibold">
          Edit your provider profile
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Applicants see your name, location, and contact details when browsing training programs.
        </p>

        <form action={formAction} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-foreground" htmlFor="provider-name">
              Name
              <input
                id="provider-name"
                name="name"
                type="text"
                required
                defaultValue={initialProvider.name}
                className={`mt-2 ${fieldClass}`}
              />
            </label>

            <label className="block text-sm font-semibold text-foreground" htmlFor="provider-location">
              Location
              <input
                id="provider-location"
                name="location"
                type="text"
                required
                defaultValue={initialProvider.location}
                className={`mt-2 ${fieldClass}`}
              />
            </label>

            <label
              className="block text-sm font-semibold text-foreground"
              htmlFor="provider-phone"
            >
              Contact phone <span className="font-normal text-muted">(optional)</span>
              <input
                id="provider-phone"
                name="contact_phone"
                type="tel"
                defaultValue={initialProvider.contact_phone ?? ""}
                className={`mt-2 ${fieldClass}`}
              />
            </label>

            <label className="block text-sm font-semibold text-foreground" htmlFor="provider-url">
              Contact URL <span className="font-normal text-muted">(optional, HTTPS)</span>
              <input
                id="provider-url"
                name="contact_url"
                type="url"
                defaultValue={initialProvider.contact_url ?? ""}
                className={`mt-2 ${fieldClass}`}
              />
            </label>
          </div>

          <label
            className="block text-sm font-semibold text-foreground"
            htmlFor="provider-description"
          >
            Description <span className="font-normal text-muted">(optional)</span>
            <textarea
              id="provider-description"
              name="description"
              rows={4}
              defaultValue={initialProvider.description ?? ""}
              className={`mt-2 py-2 ${fieldClass}`}
            />
          </label>

          {state.error ? <p className="text-sm text-danger" role="alert">{state.error}</p> : null}

          <SubmitButton
            pendingLabel="Saving…"
            className="min-h-11 rounded-md bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60"
          >
            Save profile
          </SubmitButton>
        </form>
      </section>
    </section>
  );
}
