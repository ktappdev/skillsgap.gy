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
  exampleTitles: string[];
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
    exampleTitles: [],
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
    detail: occupation.roleFamily,
    kind: "occupation",
    exampleTitles: occupation.exampleTitles,
    tags: [occupation.valueChainStages[0] ?? "local content", occupation.roleFamily],
  };
}

function PathwayOptionCard({ option, selected, onSelect }: { option: PickerOption; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`group flex min-h-11 w-full flex-col items-start rounded-lg border p-4 text-left transition-colors ${selected ? "border-accent bg-surface-muted" : "border-border bg-surface hover:border-accent"}`}
    >
      <span className="flex w-full items-start justify-between gap-3">
        <span className="text-xs font-semibold text-muted">
          {option.kind === "guided" ? "Guided starter route" : "Petroleum work family"}
        </span>
        <span aria-hidden="true" className={`grid size-6 shrink-0 place-items-center rounded-full border text-xs font-bold ${selected ? "border-accent bg-accent text-white" : "border-border text-transparent group-hover:border-accent"}`}>
          ✓
        </span>
      </span>
      <span className="mt-3 text-base font-semibold leading-5 tracking-tight text-foreground">{option.title}</span>

      <span className="mt-1 text-xs font-medium text-muted">{option.detail}</span>
      <span className="mt-3 line-clamp-2 text-sm leading-5 text-muted">{option.description}</span>
      {option.exampleTitles.length > 0 ? <span className="mt-2 line-clamp-2 text-xs leading-5 text-muted">Example roles: {option.exampleTitles.slice(0, 2).join(", ")}</span> : null}
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
    return [option.title, option.description, option.detail, ...option.tags, ...option.exampleTitles].some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
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
            <input id="pathway-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try mechanic, HSE, logistics…" className="min-h-11 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent" />
          </div>
        </div>
        <p className="text-sm text-muted sm:pb-3"><span className="font-semibold text-foreground">{options.length}</span> routes to explore</p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter career routes">
        {scopeLabels.map(([value, label]) => <button key={value} type="button" aria-pressed={scope === value} onClick={() => changeScope(value)} className={`inline-flex min-h-11 items-center rounded-full border px-3.5 text-sm font-semibold transition-colors ${scope === value ? "border-accent bg-accent text-white" : "border-border bg-surface text-foreground hover:border-accent hover:text-accent"}`}>{label}</button>)}
      </div>

      {selectedOption ? (
        <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-muted p-4" aria-live="polite">
          <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-white">✓</span>
          <div>
            <p className="font-semibold text-foreground">{selectedOption.title}</p>
            <p className="mt-1 text-sm leading-5 text-muted">Change it any time before building your pathway.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-4 text-sm leading-6 text-muted">Pick the closest direction. You&apos;re exploring a route, not applying.</div>
      )}

      <div id="pathway-options" className="grid gap-3 sm:grid-cols-2" aria-label="Career route options">
        {displayedOptions.map((option) => <PathwayOptionCard key={option.id} option={option} selected={option.id === selectedId} onSelect={() => onSelect(option.id)} />)}
      </div>

      {filteredOptions.length === 0 ? <p className="rounded-lg border border-border bg-surface-muted p-5 text-sm leading-6 text-muted">No routes match yet. Try “technical”, “support”, or “operations”.</p> : null}
      {!showAll && !normalizedQuery && scope === "all" && filteredOptions.length > 6 ? <button type="button" onClick={() => setShowAll(true)} className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border bg-surface px-4 py-3 text-sm font-semibold text-accent transition-colors hover:border-accent">All {filteredOptions.length} routes <span aria-hidden="true">↓</span></button> : null}
      {showAll && !normalizedQuery && scope === "all" ? <button type="button" onClick={() => setShowAll(false)} className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border bg-surface px-4 py-3 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent">Show fewer <span aria-hidden="true">↑</span></button> : null}
    </div>
  );
}
