import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ProviderAccountBoundary, ProviderSetupUnavailable } from "@/components/auth/provider-account-boundary";
import { requireUser, resolveUserHome } from "@/lib/auth/queries";
import { createProviderAccount } from "@/lib/skillsgap/provider-actions";
import { SubmitButton } from "@/components/ui/submit-button";

type ProviderSetupSearchParams = Record<string, string | string[] | undefined>;

type ProviderSetupValues = {
  name: string;
  location: string;
  contactPhone: string;
  contactUrl: string;
  description: string;
};

function getSearchParam(params: ProviderSetupSearchParams, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function ProviderSetupPage({ searchParams }: { searchParams: Promise<ProviderSetupSearchParams> }) {
  const { supabase, user } = await requireUser("/provider/setup");

  const [{ data: existing, error: existingError }, { data: profile, error: profileError }] = await Promise.all([
    supabase.from("training_providers").select("id").eq("owner_user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("account_type").eq("id", user.id).maybeSingle(),
  ]);

  if (existingError || profileError || !profile) return <ProviderSetupUnavailable />;
  if (existing) redirect("/provider");
  if (profile.account_type !== "provider") {
    return <ProviderAccountBoundary email={user.email} homeHref={await resolveUserHome(supabase, user.id)} mode="setup" />;
  }

  const params = await searchParams;
  const errorMessage = getSearchParam(params, "error") || null;
  const initialValues: ProviderSetupValues = {
    name: getSearchParam(params, "name"),
    location: getSearchParam(params, "location"),
    contactPhone: getSearchParam(params, "contact_phone"),
    contactUrl: getSearchParam(params, "contact_url"),
    description: getSearchParam(params, "description"),
  };

  return (
    <main id="main-content" className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-xl">
        <Link href="/" className="inline-flex min-h-11 items-center" aria-label="SkillsGap.gy home">
          <Image
            src="/skillsgap-logo.webp"
            alt="SkillsGap.gy"
            width={1200}
            height={728}
            priority
            className="h-7 w-auto object-contain sm:h-8"
          />
        </Link>
        <section className="mt-6 rounded-lg border border-border bg-surface p-6 sm:p-8" aria-labelledby="provider-setup-heading">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Step 2 of 2 · Organisation details</p>
          <h1 id="provider-setup-heading" className="mt-3 text-3xl font-semibold tracking-tight">Set up your training provider profile</h1>
          <p className="mt-3 text-sm leading-6 text-muted">Add your organisation so applicants can find your programs and the qualifications they support. You can manage programs while verification is pending; an administrator verifies providers before they appear in public recommendations.</p>
          <ProviderSetupForm errorMessage={errorMessage} initialValues={initialValues} />
        </section>
      </div>
    </main>
  );
}

function ProviderSetupForm({ errorMessage, initialValues }: { errorMessage: string | null; initialValues: ProviderSetupValues }) {
  return (
    <form action={createProviderAccount} className="mt-6 space-y-4">
      <Field label="Provider name" name="name" required maxLength={160} defaultValue={initialValues.name} />
      <Field label="Location" name="location" required maxLength={160} defaultValue={initialValues.location} />
      <Field label="Contact phone (optional)" name="contact_phone" type="tel" maxLength={160} defaultValue={initialValues.contactPhone} />
      <Field label="Contact URL (optional)" name="contact_url" type="url" maxLength={2048} defaultValue={initialValues.contactUrl} />
      <label className="block text-sm font-semibold text-foreground" htmlFor="provider-description">
        Description (optional)
        <textarea id="provider-description" name="description" defaultValue={initialValues.description} maxLength={2000} rows={4} className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm font-normal outline-none focus:border-accent" />
      </label>
      {errorMessage ? <p className="text-sm text-danger" role="alert">{errorMessage}</p> : null}
      <SubmitButton className="min-h-11 w-full rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong">Create provider profile</SubmitButton>
    </form>
  );
}

function Field({ label, name, type = "text", required = false, maxLength, defaultValue }: { label: string; name: string; type?: "text" | "url" | "tel"; required?: boolean; maxLength?: number; defaultValue?: string }) {
  const id = `provider-${name}`;
  return (
    <label className="block text-sm font-semibold text-foreground" htmlFor={id}>
      {label}
      <input id={id} required={required} defaultValue={defaultValue} maxLength={maxLength} name={name} type={type} className="mt-2 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal outline-none focus:border-accent" />
    </label>
  );
}
