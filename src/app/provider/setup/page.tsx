import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ProviderAccountBoundary, ProviderSetupUnavailable } from "@/components/auth/provider-account-boundary";
import { ProviderProfileFields, type ProviderProfileFormValues } from "@/components/skillsgap/provider-profile-fields";
import { requireUser, resolveUserHome } from "@/lib/auth/queries";
import { createProviderAccount } from "@/lib/skillsgap/provider-actions";
import { SubmitButton } from "@/components/ui/submit-button";

type ProviderSetupSearchParams = Record<string, string | string[] | undefined>;

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
  const initialValues: ProviderProfileFormValues = {
    name: getSearchParam(params, "name"),
    provider_type: getSearchParam(params, "provider_type"),
    location: getSearchParam(params, "location"),
    physical_address: getSearchParam(params, "physical_address"),
    service_area: getSearchParam(params, "service_area"),
    contact_email: getSearchParam(params, "contact_email"),
    contact_phone: getSearchParam(params, "contact_phone"),
    contact_url: getSearchParam(params, "contact_url"),
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
          <p className="mt-3 text-sm leading-6 text-muted">Add your public organisation details so learners can find the right provider. You can add programs while verification is pending; an administrator reviews your organisation before listings appear in public recommendations.</p>
          <ProviderSetupForm errorMessage={errorMessage} initialValues={initialValues} />
        </section>
      </div>
    </main>
  );
}

function ProviderSetupForm({ errorMessage, initialValues }: { errorMessage: string | null; initialValues: ProviderProfileFormValues }) {
  return (
    <form action={createProviderAccount} className="mt-6 space-y-4">
      <ProviderProfileFields values={initialValues} />
      {errorMessage ? <p className="text-sm text-danger" role="alert">{errorMessage}</p> : null}
      <SubmitButton pendingLabel="Creating…" className="min-h-11 w-full rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong">Create provider profile</SubmitButton>
    </form>
  );
}
