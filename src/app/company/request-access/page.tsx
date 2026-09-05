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
  const errorMessage = params.error === "duplicate" ? "That company already has a request." : params.error ? "Please check the company name and try again." : null;
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-xl">
        <Link href="/" className="font-semibold text-accent underline-offset-4 hover:underline">← skillsgap.gy</Link>
        <section className="mt-10 border border-border bg-surface p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Company access</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Join the trusted employer network.</h1>
          <p className="mt-3 text-sm leading-6 text-muted">Tell us who you are. A platform administrator will verify your company before roles can be published.</p>
          {company ? <CompanyRequestStatus name={company.name} status={company.status} /> : <CompanyRequestForm errorMessage={errorMessage} />}
        </section>
      </div>
    </main>
  );
}

function CompanyRequestStatus({ name, status }: { name: string; status: "pending" | "rejected" }) {
  const pending = status === "pending";
  return (
    <div className={`mt-7 border p-4 text-sm leading-6 ${pending ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900"}`} role="status">
      <p className="font-semibold">{name}</p>
      <p>{pending ? "Your verification request is pending. You will enter the company workspace after a platform administrator approves it." : "This request was not approved. A platform administrator can review it again after the company details are clarified."}</p>
    </div>
  );
}

function CompanyRequestForm({ errorMessage }: { errorMessage: string | null }) {
  return (
    <form action={requestCompanyAccess} className="mt-7 space-y-4">
      <Field label="Company name" name="company" />
      <Field label="Company website (optional)" name="website" type="url" />
      <label className="block text-sm font-semibold text-foreground" htmlFor="company-description">
        What work do you do?
        <textarea id="company-description" name="description" maxLength={2000} rows={4} className="mt-2 w-full border border-border bg-surface px-3 py-2 text-sm font-normal outline-none focus:border-accent" />
      </label>
      {errorMessage ? <p className="text-sm text-danger" role="alert">{errorMessage}</p> : null}
      <button type="submit" className="min-h-11 w-full bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong">Request access</button>
    </form>
  );
}

function Field({ label, name, type = "text" }: { label: string; name: string; type?: "text" | "url" }) {
  const id = `company-${name}`;
  return (
    <label className="block text-sm font-semibold text-foreground" htmlFor={id}>
      {label}
      <input id={id} required={name === "company"} maxLength={name === "company" ? 160 : 2048} name={name} type={type} className="mt-2 min-h-11 w-full border border-border bg-surface px-3 text-sm font-normal outline-none focus:border-accent" />
    </label>
  );
}
