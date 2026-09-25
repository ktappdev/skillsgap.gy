"use client";

import Link from "next/link";

import { bestPositionForOccupation, type InterestSuggestion, type RelatedPosition } from "@/lib/i-want-to-become/interests";

type CareerSuggestionsProps = {
  suggestions: InterestSuggestion[];
  positions: RelatedPosition[];
  selectedId: string;
  onSelect: (occupationSlug: string) => void;
  onBrowseAll: () => void;
};

export function CareerSuggestions({ suggestions, positions, selectedId, onSelect, onBrowseAll }: CareerSuggestionsProps) {
  return (
    <section className="mt-5" aria-labelledby="suggestions-title">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-accent">Based on your interests</p>
          <h3 id="suggestions-title" className="mt-1 text-xl font-semibold text-foreground">Paths you could explore</h3>
        </div>
        <p className="text-xs text-muted">Exploratory suggestions, not a job-fit score.</p>
      </div>
      <div className="mt-4 grid gap-3">
        {suggestions.length > 0 ? suggestions.map(({ occupation, explanation }) => {
          const position = bestPositionForOccupation(positions, occupation.slug);
          const selected = selectedId === occupation.slug;
          return <article key={occupation.slug} className={`rounded-lg border p-4 transition-colors ${selected ? "border-accent bg-surface-muted" : "border-border bg-surface"}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h4 className="text-base font-semibold text-foreground">{occupation.title}</h4>
                <p className="mt-1 text-sm leading-5 text-muted">{occupation.industryTransferSummary}</p>
                <p className="mt-3 text-sm text-foreground"><span className="font-semibold">Suggested because you chose:</span> {explanation.join(", ")}</p>
                {position ? <p className="mt-3 text-sm text-muted">Related position: <Link className="font-semibold text-accent underline-offset-4 hover:underline" href={`/opportunities/${position.id}`}>{position.title}</Link>{position.isDemo ? <span className="ml-2 inline-flex rounded bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-muted">Demo</span> : null}</p> : <p className="mt-3 text-sm text-muted">No related position is listed right now. You can still explore this career path.</p>}
              </div>
              <button type="button" onClick={() => onSelect(occupation.slug)} aria-pressed={selected} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border border-accent px-4 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{selected ? "Selected" : "Explore this path"}</button>
            </div>
          </article>;
        }) : <p className="rounded-lg border border-dashed border-border p-4 text-sm leading-6 text-muted">No paths match those choices yet. Try another interest or browse every path.</p>}
      </div>
      <button type="button" onClick={onBrowseAll} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:border-accent hover:text-accent">Browse all career paths</button>
    </section>
  );
}
