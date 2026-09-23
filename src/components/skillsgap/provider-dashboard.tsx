"use client";

import Link from "next/link";
import { useActionState } from "react";

import { ProviderProfileFields } from "@/components/skillsgap/provider-profile-fields";
import { ProviderVerificationForm } from "@/components/skillsgap/provider-verification-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateProviderProfile, type ProviderActionResult } from "@/lib/skillsgap/provider-actions";
import type { Tables } from "@/lib/supabase/database.types";

type ProviderStats = { total: number; ready: number; live: number };
type ProviderProfile = Pick<
  Tables<"training_providers">,
  "id" | "name" | "provider_type" | "location" | "physical_address" | "service_area" | "contact_email" | "contact_phone" | "contact_url" | "description" | "is_verified"
>;

const initialState: ProviderActionResult = {};

async function profileAction(_previousState: ProviderActionResult, formData: FormData): Promise<ProviderActionResult> {
  return updateProviderProfile(formData);
}

export function ProviderDashboard({
  initialProvider,
  verificationDetails,
  programStats,
}: {
  initialProvider: ProviderProfile;
  verificationDetails: Tables<"training_provider_verification_details"> | null;
  programStats: ProviderStats;
}) {
  const [state, formAction] = useActionState(profileAction, initialState);
  const publicProgramCount = initialProvider.is_verified ? programStats.live : 0;

  return (
    <section className="mt-6 space-y-6" aria-label="Provider overview">
      {!initialProvider.is_verified ? (
        <div className="flex flex-col gap-3 border border-accent/30 bg-teal-50/40 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-foreground">Complete verification to appear in learner recommendations</p>
            <p className="mt-1 text-sm leading-6 text-muted">Your profile and programs stay private until an administrator verifies your organisation.</p>
          </div>
          <Link href="#provider-verification-heading" className="inline-flex min-h-11 shrink-0 items-center font-semibold text-accent underline-offset-4 hover:underline">Submit organisation details ↓</Link>
        </div>
      ) : null}

      <dl className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-5">
          <dt className="text-sm text-muted">Programs in your catalogue</dt>
          <dd className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{programStats.total}</dd>
          <dd className="mt-1 text-sm leading-6 text-muted">Includes drafts and active programs.</dd>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <dt className="text-sm text-muted">Mapped to active qualifications</dt>
          <dd className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{programStats.ready}</dd>
          <dd className="mt-1 text-sm leading-6 text-muted">These can be connected to applicant skill gaps.</dd>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <dt className="text-sm text-muted">Visible to learners</dt>
          <dd className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{publicProgramCount}</dd>
          <dd className="mt-1 text-sm leading-6 text-muted">Active programs from verified providers.</dd>
        </div>
      </dl>

      {programStats.total === 0 ? (
        <section className="rounded-lg border border-accent bg-surface-muted p-5 sm:p-6" aria-labelledby="first-program-heading">
          <h2 id="first-program-heading" className="text-xl font-semibold">Add your first program</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Describe who it is for, what learners earn, how it is delivered, and what it costs. Then map the qualifications it supports.</p>
          <Link href="/provider/programs#create-program-heading" className="mt-4 inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong">Add a training program</Link>
        </section>
      ) : null}

      <section className="rounded-lg border border-border bg-surface p-5 sm:p-6" aria-labelledby="provider-profile-heading">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="provider-profile-heading" className="text-xl font-semibold">Public provider profile</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Keep learner-facing contact, location, service area, and organisation information current.</p>
          </div>
          {initialProvider.is_verified ? <Link href={`/training/providers/${initialProvider.id}`} className="inline-flex min-h-11 items-center font-semibold text-accent underline-offset-4 hover:underline">View public profile ↗</Link> : null}
        </div>

        <form action={formAction} className="mt-5 space-y-4">
          <ProviderProfileFields values={initialProvider} />
          {state.error ? <p className="text-sm text-danger" role="alert">{state.error}</p> : null}
          {state.message ? <p className="text-sm text-accent" role="status">{state.message}</p> : null}
          <SubmitButton pendingLabel="Saving…" className="min-h-11 rounded-md bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60">Save public profile</SubmitButton>
        </form>
      </section>

      <ProviderVerificationForm initialDetails={verificationDetails} isVerified={initialProvider.is_verified} />
    </section>
  );
}
