import Link from "next/link";

import type { Json, Tables } from "@/lib/supabase/database.types";

function readSavedResults(value: Json): Array<{ subject: string; grade: string }> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) return [];
    const subject = item.subject;
    const grade = item.grade;
    return typeof subject === "string" && typeof grade === "string" ? [{ subject, grade }] : [];
  });
}

export function SavedCareerRoute({ plan }: { plan: Tables<"applicant_pathway_plans"> | null }) {
  if (!plan) {
    return (
      <section className="border border-border bg-surface p-5" aria-labelledby="saved-route-title">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Career direction</p>
        <h2 id="saved-route-title" className="mt-2 text-xl font-semibold tracking-tight">No route saved yet</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Choose a future direction and keep the plan beside your CV, skills, and opportunities.</p>
        <Link href="/i-want-to-become" className="mt-4 inline-flex min-h-11 items-center font-semibold text-accent underline-offset-4 hover:underline">Build a career route <span aria-hidden="true" className="ml-2">→</span></Link>
      </section>
    );
  }

  const results = readSavedResults(plan.csec_results);
  const progressItems = plan.pathway_kind === "guided" ? plan.planned_requirement_names : plan.completed_action_ids;
  const progressLabel = plan.pathway_kind === "guided" ? "requirements on your list" : "actions completed";

  return (
    <section className="border border-accent/30 bg-teal-50/40 p-5" aria-labelledby="saved-route-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Saved career route</p>
          <h2 id="saved-route-title" className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{plan.pathway_title}</h2>
          <p className="mt-2 text-sm text-muted">{progressItems.length} {progressLabel}</p>
        </div>
        <Link href="/i-want-to-become" className="inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline">Update route</Link>
      </div>

      {plan.selected_interests.length > 0 ? <div className="mt-5"><p className="text-sm font-semibold text-foreground">Interests</p><ul className="mt-2 flex flex-wrap gap-2">{plan.selected_interests.map((interest) => <li key={interest} className="border border-border bg-surface px-3 py-1.5 text-sm text-foreground">{interest}</li>)}</ul></div> : null}
      {plan.interests_note ? <p className="mt-4 text-sm leading-6 text-muted"><span className="font-semibold text-foreground">Your note:</span> {plan.interests_note}</p> : null}
      {results.length > 0 ? <div className="mt-5"><p className="text-sm font-semibold text-foreground">CSEC/CXC starting point</p><ul className="mt-2 flex flex-wrap gap-2">{results.map((result) => <li key={`${result.subject}-${result.grade}`} className="border border-border bg-surface px-3 py-1.5 text-sm text-foreground">{result.subject}: Grade {result.grade}</li>)}</ul></div> : null}
      <p className="mt-5 border-t border-border pt-4 text-xs leading-5 text-muted">Private planning signals only. These entries are not verified qualifications and do not change your job-match score.</p>
    </section>
  );
}
