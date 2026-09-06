import Link from "next/link";

import { getSavedPathwayView, type SavedPathwayItem } from "@/lib/i-want-to-become/saved-pathway";
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

function ItemBadge({ item }: { item: SavedPathwayItem }) {
  if (item.status === "saved") {
    return <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-accent">On your list</span>;
  }
  if (item.status === "complete") {
    return <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">Complete</span>;
  }
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.kind === "requirement" && item.mandatory ? "bg-amber-100 text-amber-900" : "bg-surface-muted text-accent"}`}>{item.kind === "requirement" ? item.mandatory ? "Required" : "Preferred" : "Next step"}</span>;
}

function SavedPathwayItemRow({ item, position }: { item: SavedPathwayItem; position: number }) {
  const supportingText = item.supportingText ? `${item.supportingText}${item.minimumYears ? ` · ${item.minimumYears}+ years experience` : ""}` : item.minimumYears ? `${item.minimumYears}+ years experience` : null;
  return <li className="flex items-start justify-between gap-3 border-t border-border py-3 first:border-t-0"><div className="flex min-w-0 gap-3"><span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${item.status === "saved" || item.status === "complete" ? "bg-accent text-white" : "bg-surface-muted text-accent"}`} aria-hidden="true">{item.status === "saved" || item.status === "complete" ? "✓" : position}</span><div className="min-w-0"><p className="font-semibold text-foreground">{item.name}</p>{item.detail ? <p className="mt-1 text-sm leading-5 text-muted">{item.detail}</p> : null}{supportingText ? <p className="mt-1 text-xs leading-5 text-muted">{supportingText}</p> : null}</div></div><ItemBadge item={item} /></li>;
}

export async function SavedCareerRoute({ plan }: { plan: Tables<"applicant_pathway_plans"> | null }) {
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
  const progressLabel = plan.pathway_kind === "guided" ? "requirements on your list" : "next steps complete";
  const pathwayView = await getSavedPathwayView(plan);

  return (
    <section className="border border-accent/30 bg-teal-50/40 p-5" aria-labelledby="saved-route-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Saved career route</p>
          <h2 id="saved-route-title" className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{plan.pathway_title}</h2>
          <p className="mt-2 text-sm text-muted">{progressItems.length} {progressLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3"><Link href={pathwayView.href} className="inline-flex min-h-11 items-center rounded-md bg-accent px-3.5 text-sm font-semibold text-white transition hover:bg-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{pathwayView.linkLabel} <span aria-hidden="true" className="ml-2">→</span></Link><Link href="/i-want-to-become" className="inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Update route</Link></div>
      </div>

      {plan.selected_interests.length > 0 ? <div className="mt-5"><p className="text-sm font-semibold text-foreground">Interests</p><ul className="mt-2 flex flex-wrap gap-2">{plan.selected_interests.map((interest) => <li key={interest} className="border border-border bg-surface px-3 py-1.5 text-sm text-foreground">{interest}</li>)}</ul></div> : null}
      {plan.interests_note ? <p className="mt-4 text-sm leading-6 text-muted"><span className="font-semibold text-foreground">Your note:</span> {plan.interests_note}</p> : null}
      {results.length > 0 ? <div className="mt-5"><p className="text-sm font-semibold text-foreground">CSEC/CXC starting point</p><ul className="mt-2 flex flex-wrap gap-2">{results.map((result) => <li key={`${result.subject}-${result.grade}`} className="border border-border bg-surface px-3 py-1.5 text-sm text-foreground">{result.subject}: Grade {result.grade}</li>)}</ul></div> : null}
      <section className="mt-6 border-t border-border pt-5" aria-labelledby="saved-route-items-title"><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 id="saved-route-items-title" className="text-lg font-semibold tracking-tight text-foreground">{pathwayView.itemLabel}</h3><span className="text-sm font-semibold text-accent">{pathwayView.items.length} total</span></div>{pathwayView.items.length > 0 ? <ul className="mt-3" role="list">{pathwayView.items.map((item, index) => <SavedPathwayItemRow key={item.id} item={item} position={index + 1} />)}</ul> : <p className="mt-3 text-sm leading-6 text-muted">Open the route details to review the latest published steps.</p>}</section>
      <p className="mt-5 border-t border-border pt-4 text-xs leading-5 text-muted">Private planning signals only. These entries are not verified qualifications and do not change your job-match score.</p>
    </section>
  );
}
