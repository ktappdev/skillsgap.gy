"use client";

import { useState } from "react";

import { updateApplicantExperience } from "@/lib/skillsgap/actions";
import type { Tables } from "@/lib/supabase/database.types";

type ExperienceDraft = {
  title: string;
  employer: string;
  years: string;
};

type ExperienceReviewProps = {
  initialExperience: Tables<"applicant_experience">[];
};

export function ExperienceReview({ initialExperience }: ExperienceReviewProps) {
  const [drafts, setDrafts] = useState<Record<string, ExperienceDraft>>(() => {
    const values: Record<string, ExperienceDraft> = {};
    for (const item of initialExperience) {
      values[item.id] = {
        title: item.title,
        employer: item.employer ?? "",
        years: String(item.years),
      };
    }
    return values;
  });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (initialExperience.length === 0) return null;

  function updateDraft(id: string, field: keyof ExperienceDraft, value: string) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], [field]: value } }));
  }

  async function save(item: Tables<"applicant_experience">) {
    const draft = drafts[item.id];
    if (!draft) return;
    setSavingId(item.id);
    setMessage(null);
    const result = await updateApplicantExperience(item.id, draft.title, draft.employer, draft.years);
    setSavingId(null);
    setMessage(result.error ?? "Work history updated. Your matches will refresh shortly.");
  }

  return (
    <section className="border border-border bg-surface p-5 shadow-sm" aria-labelledby="experience-heading">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Work history found</p>
      <h2 id="experience-heading" className="mt-2 text-xl font-semibold tracking-tight">Check what we recognized</h2>
      <p className="mt-2 text-sm leading-6 text-muted">Make a correction if a title, employer, or time period needs adjusting. Your matches will be recalculated.</p>
      <ul className="mt-5 divide-y divide-border border-y border-border" role="list">
        {initialExperience.map((item) => {
          const draft = drafts[item.id];
          if (!draft) return null;
          return (
            <li key={item.id} className="py-4 first:pt-0 last:pb-0">
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_8rem_auto] sm:items-end">
                <label className="text-xs font-semibold text-muted">
                  Work title
                  <input value={draft.title} onChange={(event) => updateDraft(item.id, "title", event.target.value)} className="mt-1 min-h-10 w-full border border-border bg-surface px-3 text-sm font-normal text-foreground outline-none focus:border-accent" />
                </label>
                <label className="text-xs font-semibold text-muted">
                  Employer <span className="font-normal">(optional)</span>
                  <input value={draft.employer} onChange={(event) => updateDraft(item.id, "employer", event.target.value)} className="mt-1 min-h-10 w-full border border-border bg-surface px-3 text-sm font-normal text-foreground outline-none focus:border-accent" />
                </label>
                <label className="text-xs font-semibold text-muted">
                  Years
                  <input type="number" min={0} max={60} step={0.5} value={draft.years} onChange={(event) => updateDraft(item.id, "years", event.target.value)} className="mt-1 min-h-10 w-full border border-border bg-surface px-3 text-sm font-normal text-foreground outline-none focus:border-accent" />
                </label>
                <button type="button" onClick={() => { void save(item); }} disabled={savingId === item.id} className="min-h-10 border border-accent px-3 text-sm font-semibold text-accent hover:bg-teal-50 disabled:cursor-wait disabled:opacity-60">
                  {savingId === item.id ? "Saving…" : "Save"}
                </button>
              </div>
              {item.evidence ? <p className="mt-3 text-xs leading-5 text-muted">Evidence found: {item.evidence}</p> : null}
            </li>
          );
        })}
      </ul>
      {message ? <p className="mt-3 text-sm text-muted" role="status">{message}</p> : null}
    </section>
  );
}
