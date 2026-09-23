import Link from "next/link";
import { redirect } from "next/navigation";

import { CompanyRequestForm } from "@/components/company/company-request-form";
import { requireUser } from "@/lib/auth/queries";

export default async function RequestAccessPage({ searchParams }: { searchParams: Promise<{ submitted?: string; error?: string }> }) {
  const { supabase, user } = await requireUser("/company/request-access");
  const membershipResult = await supabase.from("company_members").select("company_id").eq("user_id", user.id).maybeSingle();
  if (membershipResult.error) throw new Error("Company request lookup failed. Please try again.");
  const membership = membershipResult.data;
  const companyResult = membership
    ? await supabase.from("companies").select("name,status,website_url,industry,location,contact_phone,description,requested_by").eq("id", membership.company_id).maybeSingle()
    : null;
  if (companyResult?.error || (membership && !companyResult?.data)) throw new Error("Company request lookup failed. Please try again.");
  const company = companyResult?.data;
  if (company?.status === "approved") redirect("/company");
  if (!company) {
    const profile = await supabase.from("profiles").select("account_type").eq("id", user.id).maybeSingle();
    if (profile.error || !profile.data) throw new Error("Company account lookup failed. Please try again.");
    if (profile.data.account_type !== "company") redirect("/signup/company");
  }
  const submitted = (await searchParams).submitted === "1";

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
            {company.status === "rejected" && company.requested_by === user.id ? <CompanyRequestForm
              mode="resubmit"
              initialValues={{ name: company.name, website: company.website_url ?? "", industry: company.industry ?? "", location: company.location ?? "", contactPhone: company.contact_phone ?? "", description: company.description ?? "" }}
              pendingLabel="Resubmitting…"
              submitLabel="Resubmit for review"
            /> : null}
          </> : <CompanyRequestForm />}
          <p className="mt-6 text-sm leading-6 text-muted">
            Existing company listings cannot be claimed automatically. An administrator must arrange access and ownership.
          </p>
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
