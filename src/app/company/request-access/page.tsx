import Link from "next/link";
import { redirect } from "next/navigation";

import { SubmitButton } from "@/components/ui/submit-button";
import { requestCompanyAccess, resubmitCompanyAccess } from "@/lib/skillsgap/actions";
import { requireUser } from "@/lib/auth/queries";

export default async function RequestAccessPage({ searchParams }: { searchParams: Promise<{ submitted?: string; error?: string }> }) {
  const { supabase, user } = await requireUser("/company/request-access");
  const { data: membership } = await supabase.from("company_members").select("company_id").eq("user_id", user.id).maybeSingle();
  const company = membership
    ? (await supabase.from("companies").select("name,status,website_url,description").eq("id", membership.company_id).maybeSingle()).data
    : null;
  if (company?.status === "approved") redirect("/company");

  const params = await searchParams;
  const submitted = params.submitted === "1";
  const errorMessage = params.error === "duplicate"
    ? "That company already has a request."
    : params.error === "state"
      ? "This company request is no longer available. Refresh and try again."
      : params.error
        ? "Check the company name and try again."
        : null;

  return (
    <main id="main-content" className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-xl">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center font-semibold text-accent underline-offset-4 hover:underline"
        >
          ← skillsgap.gy
        </Link>
        <section className="mt-6 rounded-lg border border-border bg-surface p-6">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Request company access</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Tell us about your company. An administrator verifies each company
            before roles can be published.
          </p>
          {submitted ? <p className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800" role="status">Your company request was sent for review. We&apos;ll show your workspace here once it is approved.</p> : null}
          {company ? <>
            <CompanyRequestStatus name={company.name} status={company.status} />
            {company.status === "rejected" ? <CompanyRequestForm
              action={resubmitCompanyAccess}
              errorMessage={errorMessage}
              initialValues={{ name: company.name, website: company.website_url ?? "", description: company.description ?? "" }}
              pendingLabel="Resubmitting…"
              submitLabel="Resubmit for review"
            /> : null}
          </> : <CompanyRequestForm action={requestCompanyAccess} errorMessage={errorMessage} />}
          <p className="mt-6 text-sm leading-6 text-muted">
            Once approved, you can post roles and see anonymized matches.
          </p>
        </section>
      </div>
    </main>
  );
}

function CompanyRequestStatus({ name, status }: { name: string; status: "pending" | "rejected" }) {
  const pending = status === "pending";
  return (
    <div className={`mt-6 rounded-lg border p-4 text-sm leading-6 ${pending ? "border-border bg-surface-muted text-foreground" : "border-amber-200 bg-amber-50 text-amber-900"}`} role="status">
      <p className="font-semibold">{name}</p>
      <p>{pending ? "Verification is pending. You enter the company workspace after approval." : "This request was not approved. Update the details below and send it back for review."}</p>
    </div>
  );
}

function CompanyRequestForm({ action, errorMessage, initialValues, pendingLabel = "Sending request…", submitLabel = "Request access" }: { action: (formData: FormData) => Promise<void>; errorMessage: string | null; initialValues?: { name: string; website: string; description: string }; pendingLabel?: string; submitLabel?: string }) {
  return (
    <form action={action} className="mt-6 space-y-4">
      <Field label="Company name" name="company" defaultValue={initialValues?.name} />
      <Field label="Company website (optional)" name="website" type="url" defaultValue={initialValues?.website} />
      <label className="block text-sm font-semibold text-foreground" htmlFor="company-description">
        What work do you do?
        <textarea id="company-description" name="description" defaultValue={initialValues?.description} maxLength={2000} rows={4} className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm font-normal outline-none focus:border-accent" />
      </label>
      {errorMessage ? <p className="text-sm text-danger" role="alert">{errorMessage}</p> : null}
      <SubmitButton pendingLabel={pendingLabel} className="min-h-11 w-full rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}

function Field({ label, name, type = "text", defaultValue }: { label: string; name: string; type?: "text" | "url"; defaultValue?: string }) {
  const id = `company-${name}`;
  return (
    <label className="block text-sm font-semibold text-foreground" htmlFor={id}>
      {label}
      <input id={id} required={name === "company"} defaultValue={defaultValue} maxLength={name === "company" ? 160 : 2048} name={name} type={type} className="mt-2 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal outline-none focus:border-accent" />
    </label>
  );
}
