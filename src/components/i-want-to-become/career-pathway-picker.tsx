"use client";

import { useMemo, useState } from "react";

import { careerPathways, type CareerPathway } from "@/lib/i-want-to-become/catalog";
import type { PublicOccupation } from "@/lib/i-want-to-become/occupations";

type CareerPathwayPickerProps = {
  occupations: PublicOccupation[];
  selectedId: string;
  onSelect: (id: string) => void;
};

type PickerScope = "all" | "guided" | "occupation";

type PickerOption = {
  id: string;
  title: string;
  description: string;
  detail: string;
  kind: "guided" | "occupation";
  tags: string[];
};

const scopeLabels: Array<[PickerScope, string]> = [
  ["all", "All routes"],
  ["guided", "Starter routes"],
  ["occupation", "Petroleum roles"],
];

function guidedOption(pathway: CareerPathway): PickerOption {
  return {
    id: pathway.id,
    title: pathway.title,
    description: pathway.description,
    detail: pathway.location,
    kind: "guided",
    tags: ["CSEC/CXC start", "Guided route"],
  };
}

function occupationOption(occupation: PublicOccupation): PickerOption {
  return {
    id: occupation.slug,
    title: occupation.title,
    description: occupation.industryTransferSummary,
    detail: `${occupation.roleFamily} · ISCO-08 ${occupation.isco08Code}`,
    kind: "occupation",
    tags: [occupation.valueChainStages[0] ?? "local content", occupation.roleFamily],
  };
}

function PathwayOptionCard({ option, selected, onSelect }: { option: PickerOption; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`group flex min-h-40 w-full flex-col items-start border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${selected ? "border-accent bg-teal-50/70 shadow-sm" : "border-border bg-white hover:border-accent hover:bg-teal-50/30"}`}
    >
      <span className="flex w-full items-start justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
          {option.kind === "guided" ? "Guided starter route" : "Petroleum work family"}
        </span>
        <span aria-hidden="true" className={`grid size-6 shrink-0 place-items-center rounded-full border text-xs font-bold ${selected ? "border-accent bg-accent text-white" : "border-border text-transparent group-hover:border-accent"}`}>
          ✓
        </span>
      </span>
      <span className="mt-3 text-base font-semibold leading-5 tracking-tight text-foreground">{option.title}</span>
      <span className="mt-1 text-xs font-medium text-muted">{option.detail}</span>
      <span className="mt-3 line-clamp-2 text-sm leading-5 text-muted">{option.description}</span>
      <span className="mt-auto flex flex-wrap gap-1.5 pt-4">
        {option.tags.map((tag) => <span key={tag} className="border border-border bg-surface px-2 py-1 text-[11px] font-semibold capitalize text-muted">{tag}</span>)}
      </span>
    </button>
  );
}

export function CareerPathwayPicker({ occupations, selectedId, onSelect }: CareerPathwayPickerProps) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<PickerScope>("all");
  const [showAll, setShowAll] = useState(false);
  const options = useMemo(() => [...careerPathways.map(guidedOption), ...occupations.map(occupationOption)], [occupations]);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredOptions = useMemo(() => options.filter((option) => {
    if (scope !== "all" && option.kind !== scope) return false;
    if (!normalizedQuery) return true;
    return [option.title, option.description, option.detail, ...option.tags].some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
  }), [normalizedQuery, options, scope]);
  const displayedOptions = showAll || normalizedQuery || scope !== "all" ? filteredOptions : filteredOptions.slice(0, 6);
  const selectedOption = options.find((option) => option.id === selectedId) ?? null;

  function changeScope(nextScope: PickerScope) {
    setScope(nextScope);
    setShowAll(false);
  }

  return (
    <div className="mt-5 space-y-5">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          <label htmlFor="pathway-search" className="text-sm font-semibold text-foreground">Search the catalogue</label>
          <div className="relative mt-2">
            <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">⌕</span>
            <input id="pathway-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try mechanic, HSE, logistics…" className="min-h-12 w-full border border-border bg-white pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent" />
          </div>
        </div>
        <p className="text-sm text-muted sm:pb-3"><span className="font-semibold text-foreground">{options.length}</span> routes to explore</p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter career routes">
        {scopeLabels.map(([value, label]) => <button key={value} type="button" aria-pressed={scope === value} onClick={() => changeScope(value)} className={`min-h-10 rounded-full border px-3.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${scope === value ? "border-accent bg-accent text-white" : "border-border bg-surface text-foreground hover:border-accent hover:text-accent"}`}>{label}</button>)}
      </div>

      {selectedOption ? (
        <div className="flex items-start gap-3 border-l-4 border-accent bg-surface-muted p-4" aria-live="polite">
          <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-white">✓</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">Selected direction</p>
            <p className="mt-1 font-semibold text-foreground">{selectedOption.title}</p>
            <p className="mt-1 text-sm leading-5 text-muted">You can change this at any point before building your pathway.</p>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-accent/50 bg-teal-50/30 p-4 text-sm leading-6 text-muted">Pick the direction that feels closest. You are choosing a route to explore, not applying for a job.</div>
      )}

      <div id="pathway-options" className="grid gap-3 sm:grid-cols-2" aria-label="Career route options">
        {displayedOptions.map((option) => <PathwayOptionCard key={option.id} option={option} selected={option.id === selectedId} onSelect={() => onSelect(option.id)} />)}
      </div>

      {filteredOptions.length === 0 ? <p className="border border-border bg-surface-muted p-5 text-sm leading-6 text-muted">No routes match that search yet. Try a broader term like “technical”, “support”, or “operations”.</p> : null}
      {!showAll && !normalizedQuery && scope === "all" && filteredOptions.length > 6 ? <button type="button" onClick={() => setShowAll(true)} className="w-full border border-border bg-white px-4 py-3 text-sm font-semibold text-accent transition hover:border-accent hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Explore all {filteredOptions.length} routes <span aria-hidden="true">↓</span></button> : null}
      {showAll && !normalizedQuery && scope === "all" ? <button type="button" onClick={() => setShowAll(false)} className="w-full border border-border bg-white px-4 py-3 text-sm font-semibold text-muted transition hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Show fewer routes <span aria-hidden="true">↑</span></button> : null}
    </div>
  );
}
