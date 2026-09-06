import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/queries";
import { createProviderAccount } from "@/lib/skillsgap/provider-actions";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function ProviderSetupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { supabase, user } = await requireUser("/provider/setup");

  // A user may only own one provider. If they already do, send them there.
  const { data: existing } = await supabase
    .from("training_providers")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (existing) redirect("/provider");

  const params = await searchParams;
  const errorMessage = params.error ? decodeURIComponent(params.error) : null;

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
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
          <h1 id="provider-setup-heading" className="text-3xl font-semibold tracking-tight">Set up your training provider profile.</h1>
          <p className="mt-3 text-sm leading-6 text-muted">List your training organisation so applicants can find your programs and the qualifications they lead to. A platform administrator verifies new providers before they go live.</p>
          <ProviderSetupForm errorMessage={errorMessage} />
        </section>
      </div>
    </main>
  );
}

function ProviderSetupForm({ errorMessage }: { errorMessage: string | null }) {
  return (
    <form action={createProviderAccount} className="mt-6 space-y-4">
      <Field label="Provider name" name="name" required maxLength={160} />
      <Field label="Location" name="location" required maxLength={160} />
      <Field label="Contact phone (optional)" name="contact_phone" type="tel" maxLength={160} />
      <Field label="Contact URL (optional)" name="contact_url" type="url" maxLength={2048} />
      <label className="block text-sm font-semibold text-foreground" htmlFor="provider-description">
        Description (optional)
        <textarea id="provider-description" name="description" maxLength={2000} rows={4} className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm font-normal outline-none focus:border-accent" />
      </label>
      {errorMessage ? <p className="text-sm text-danger" role="alert">{errorMessage}</p> : null}
      <SubmitButton className="min-h-11 w-full rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong">Create provider profile</SubmitButton>
    </form>
  );
}

function Field({ label, name, type = "text", required = false, maxLength }: { label: string; name: string; type?: "text" | "url" | "tel"; required?: boolean; maxLength?: number }) {
  const id = `provider-${name}`;
  return (
    <label className="block text-sm font-semibold text-foreground" htmlFor={id}>
      {label}
      <input id={id} required={required} maxLength={maxLength} name={name} type={type} className="mt-2 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal outline-none focus:border-accent" />
    </label>
  );
}
