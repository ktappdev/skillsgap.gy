"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import { updateCompanyProfile, type CompanyProfileActionState } from "@/lib/company/company-actions";
import type { Tables } from "@/lib/supabase/database.types";

type CompanyProfile = Pick<Tables<"companies">, "name" | "website_url" | "industry" | "location" | "contact_phone" | "description">;

const fieldClass = "mt-2 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal text-foreground outline-none placeholder:text-muted focus:border-accent";

function toFormValues(company: CompanyProfile) {
  return {
    name: company.name,
    website: company.website_url ?? "",
    industry: company.industry ?? "",
    location: company.location ?? "",
    contactPhone: company.contact_phone ?? "",
    description: company.description ?? "",
  };
}

export function CompanyProfileEditor({ company }: { company: CompanyProfile }) {
  const initialState: CompanyProfileActionState = { values: toFormValues(company) };
  const [state, formAction] = useActionState(updateCompanyProfile, initialState);

  return (
    <section className="rounded-lg border border-border bg-surface p-5 sm:p-6" aria-labelledby="company-profile-heading">
      <h2 id="company-profile-heading" className="text-xl font-semibold">Company profile</h2>
      <p className="mt-2 text-sm leading-6 text-muted">Keep the public company information beside your published positions current. Recruiters can use the same workspace, but only the owner can change these details.</p>
      <form action={formAction} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-foreground" htmlFor="company-profile-name">
            Company name
            <input id="company-profile-name" name="name" required maxLength={160} defaultValue={state.values.name} className={fieldClass} />
          </label>
          <label className="block text-sm font-semibold text-foreground" htmlFor="company-profile-industry">
            Industry or sector <span className="font-normal text-muted">(optional)</span>
            <input id="company-profile-industry" name="industry" maxLength={160} defaultValue={state.values.industry} placeholder="Energy services, logistics…" className={fieldClass} />
          </label>
          <label className="block text-sm font-semibold text-foreground" htmlFor="company-profile-location">
            Primary operating location <span className="font-normal text-muted">(optional)</span>
            <input id="company-profile-location" name="location" maxLength={160} defaultValue={state.values.location} placeholder="Georgetown, Guyana" className={fieldClass} />
          </label>
          <label className="block text-sm font-semibold text-foreground" htmlFor="company-profile-phone">
            Public company phone <span className="font-normal text-muted">(optional)</span>
            <input id="company-profile-phone" name="contact_phone" type="tel" maxLength={160} defaultValue={state.values.contactPhone} className={fieldClass} />
          </label>
        </div>
        <label className="block text-sm font-semibold text-foreground" htmlFor="company-profile-website">
          Company website <span className="font-normal text-muted">(optional)</span>
          <input id="company-profile-website" name="website" type="url" maxLength={2048} defaultValue={state.values.website} placeholder="https://example.com" className={fieldClass} />
        </label>
        <label className="block text-sm font-semibold text-foreground" htmlFor="company-profile-description">
          About the company
          <textarea id="company-profile-description" name="description" maxLength={2000} rows={4} defaultValue={state.values.description} className={`${fieldClass} py-2`} />
        </label>
        {state.error ? <p className="text-sm text-danger" role="alert">{state.error}</p> : null}
        {state.message ? <p className="text-sm text-emerald-800" role="status">{state.message}</p> : null}
        <SubmitButton pendingLabel="Saving…" className="min-h-11 rounded-md bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60">
          Save company profile
        </SubmitButton>
      </form>
    </section>
  );
}
