import Link from "next/link";
import { redirect } from "next/navigation";

import { requestCompanyAccess } from "@/lib/skillsgap/actions";
import { requireUser } from "@/lib/auth/queries";

export default async function RequestAccessPage({ searchParams }: { searchParams: Promise<{ submitted?: string; error?: string }> }) {
  const { supabase, user } = await requireUser("/company/request-access");
  const { data: membership } = await supabase.from("company_members").select("company_id").eq("user_id", user.id).maybeSingle();
  const company = membership
    ? (await supabase.from("companies").select("name,status").eq("id", membership.company_id).maybeSingle()).data
    : null;
  if (company?.status === "approved") redirect("/company");

  const params = await searchParams;
  const errorMessage = params.error === "duplicate" ? "That company already has a request." : params.error ? "Check the company name and try again." : null;

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6">
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
          {company ? <CompanyRequestStatus name={company.name} status={company.status} /> : <CompanyRequestForm errorMessage={errorMessage} />}
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
      <p>{pending ? "Verification is pending. You enter the company workspace after approval." : "This request was not approved. Clarify the company details and an administrator can review it again."}</p>
    </div>
  );
}

function CompanyRequestForm({ errorMessage }: { errorMessage: string | null }) {
  return (
    <form action={requestCompanyAccess} className="mt-6 space-y-4">
      <Field label="Company name" name="company" />
      <Field label="Company website (optional)" name="website" type="url" />
      <label className="block text-sm font-semibold text-foreground" htmlFor="company-description">
        What work do you do?
        <textarea id="company-description" name="description" maxLength={2000} rows={4} className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm font-normal outline-none focus:border-accent" />
      </label>
      {errorMessage ? <p className="text-sm text-danger" role="alert">{errorMessage}</p> : null}
      <button type="submit" className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong">
        Request access
      </button>
    </form>
  );
}

function Field({ label, name, type = "text" }: { label: string; name: string; type?: "text" | "url" }) {
  const id = `company-${name}`;
  return (
    <label className="block text-sm font-semibold text-foreground" htmlFor={id}>
      {label}
      <input id={id} required={name === "company"} maxLength={name === "company" ? 160 : 2048} name={name} type={type} className="mt-2 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal outline-none focus:border-accent" />
    </label>
  );
}
