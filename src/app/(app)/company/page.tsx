import Link from "next/link";

import { CompanyProfileEditor } from "@/components/company/company-profile-editor";
import { ManagementNav } from "@/components/skillsgap/management-nav";
import { requireApprovedCompanyMember } from "@/lib/auth/queries";

export default async function CompanyPage({ searchParams }: { searchParams: Promise<{ joined?: string }> }) {
  const { supabase, companyId, companyRole } = await requireApprovedCompanyMember("/company");
  const joined = (await searchParams).joined === "1";
  const [{ count: roleCount }, { count: candidateCount }, { count: slotCount }, { data: company }] = await Promise.all([
    supabase.from("job_roles").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "active"),
    supabase.from("job_matches").select("id,job_roles!inner(company_id)", { count: "exact", head: true }).eq("job_roles.company_id", companyId).eq("status", "current"),
    supabase.from("interview_slots").select("id,job_fairs!inner(company_id)", { count: "exact", head: true }).eq("job_fairs.company_id", companyId),
    supabase.from("companies").select("name,website_url,industry,location,contact_phone,description").eq("id", companyId).maybeSingle(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{company?.name ?? "Company workspace"}</h1>
        <span className="inline-flex items-center rounded-md bg-surface-muted px-2.5 py-1 text-xs font-semibold text-accent">Approved company</span>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Publish clear, taxonomy-backed roles, then review anonymized matches before an applicant chooses to share their identity.</p>
      {joined ? <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800" role="status">You joined the company workspace. You can now manage roles, candidates, and interview fairs.</p> : null}
      <div className="mt-6"><ManagementNav area="company" /></div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <Metric label="Active roles" value={String(roleCount ?? 0)} />
        <Metric label="Matched candidates" value={String(candidateCount ?? 0)} />
        <Metric label="Open interview slots" value={String(slotCount ?? 0)} />
      </dl>

      {(roleCount ?? 0) === 0 ? (
        <section className="mt-6 rounded-lg border border-accent bg-surface-muted p-5 sm:p-6" aria-labelledby="company-first-role-heading">
          <h2 id="company-first-role-heading" className="text-xl font-semibold">Publish your first role</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Add the role details and choose canonical qualifications. Those requirements power applicant matching and point people to verified training for each gap.</p>
          <Link href="/company/jobs" className="mt-4 inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong">Create a role <span aria-hidden="true" className="ml-2">→</span></Link>
        </section>
      ) : null}

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-border bg-surface p-6">
          <h2 className="text-xl font-semibold">Review your closest matches</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Anonymized skills, scores, applications, and outstanding gaps for your active roles.</p>
          <Link href="/company/candidates" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline">View candidates <span aria-hidden="true" className="ml-2">→</span></Link>
        </article>
        <article className="rounded-lg border border-border bg-surface p-6">
          <h2 className="text-xl font-semibold">What happens after publishing</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Your requirements are matched against confirmed applicant skills. Applicants see the role publicly, plus training routes for requirements they still need.</p>
          <Link href="/company/jobs" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline">Manage roles <span aria-hidden="true" className="ml-2">→</span></Link>
        </article>
      </section>

      {company && companyRole === "owner" ? <div className="mt-6"><CompanyProfileEditor company={company} /></div> : null}
      {companyRole !== "owner" ? <section className="mt-6 rounded-lg border border-border bg-surface-muted p-5 text-sm leading-6 text-muted">Company profile changes are managed by the owner. You can still manage roles, candidates, and interview fairs.</section> : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</dd>
    </div>
  );
}
