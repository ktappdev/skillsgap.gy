"use client";

import { useEffect, useRef, useState } from "react";

import { searchQualifications, type QualificationSearchEntry } from "@/lib/skillsgap/actions";

const inputClass = "mt-2 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal text-foreground outline-none focus:border-accent";

type QualificationSearchProps = {
  id: string;
  label: string;
  excludedQualificationIds: string[];
  selected: QualificationSearchEntry | null;
  onSelect: (qualification: QualificationSearchEntry | null) => void;
};

export function QualificationSearch({ id, label, excludedQualificationIds, selected, onSelect }: QualificationSearchProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<QualificationSearchEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const requestVersion = useRef(0);
  const cleanQuery = query.trim();
  const excludedIdsKey = excludedQualificationIds.join(",");

  useEffect(() => {
    const version = ++requestVersion.current;
    if (cleanQuery.length < 2 || selected) return;

    const timeout = window.setTimeout(() => {
      setLoading(true);
      const excludedIds = excludedIdsKey ? excludedIdsKey.split(",") : [];
      void searchQualifications(cleanQuery, page, excludedIds).then((result) => {
        if (version !== requestVersion.current) return;
        setResults(result.results);
        setTotalCount(result.totalCount);
        setError(result.error ?? null);
        setLoading(false);
      }).catch(() => {
        if (version !== requestVersion.current) return;
        setResults([]);
        setTotalCount(0);
        setError("We could not search the qualification catalogue. Try again.");
        setLoading(false);
      });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [cleanQuery, excludedIdsKey, page, selected]);

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
    onSelect(null);
    setResults([]);
    setTotalCount(0);
    setError(null);
    setLoading(value.trim().length >= 2);
  }

  const lastPage = Math.max(1, Math.ceil(totalCount / 20));

  return (
    <div className="min-w-0">
      <label className="text-sm font-semibold text-foreground" htmlFor={id}>{label}
        <input
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={!selected && cleanQuery.length >= 2}
          aria-controls={`${id}-results`}
          autoComplete="off"
          value={selected?.name ?? query}
          onChange={(event) => updateQuery(event.target.value)}
          maxLength={160}
          placeholder="Search qualification names and aliases"
          className={inputClass}
        />
      </label>
      {selected ? <div className="mt-2 flex items-start justify-between gap-3 rounded-md border border-accent bg-surface-muted p-3 text-sm">
        <span><strong>{selected.name}</strong><span className="text-muted"> · {selected.category.replaceAll("_", " ")}</span></span>
        <button type="button" onClick={() => { updateQuery(""); }} className="min-h-8 shrink-0 px-2 font-semibold text-accent underline underline-offset-2">Change</button>
      </div> : null}
      {!selected && cleanQuery.length > 0 && cleanQuery.length < 2 ? <p className="mt-2 text-xs text-muted">Enter at least two characters to search.</p> : null}
      {!selected && cleanQuery.length >= 2 ? <div className="mt-2 rounded-md border border-border bg-surface" aria-live="polite">
        {loading ? <p className="p-3 text-sm text-muted">Searching the qualification catalogue…</p> : null}
        {error ? <p className="p-3 text-sm text-danger">{error}</p> : null}
        {!loading && !error && results.length === 0 ? <p className="p-3 text-sm text-muted">No matching active qualifications. You can still request a missing one below.</p> : null}
        {results.length > 0 ? <ul id={`${id}-results`} role="listbox" aria-label="Qualification search results" className="divide-y divide-border">
          {results.map((result) => <li key={result.id}>
            <button
              type="button"
              role="option"
              aria-selected="false"
              onClick={() => { onSelect(result); setQuery(""); setResults([]); setTotalCount(0); setError(null); setLoading(false); }}
              className="min-h-11 w-full px-3 py-3 text-left hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <span className="block font-semibold text-foreground">{result.name}<span className="ml-2 text-xs font-medium text-muted">{result.category.replaceAll("_", " ")}</span></span>
              {result.description ? <span className="mt-1 block text-xs leading-5 text-muted">{result.description}</span> : null}
              {result.matching_aliases.length > 0 ? <span className="mt-1 block text-xs text-muted">Matching aliases: {result.matching_aliases.join(", ")}</span> : null}
            </button>
          </li>)}
        </ul> : null}
        {!loading && !error && totalCount > 20 ? <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2 text-sm">
          <span className="text-muted">Page {page} of {lastPage} · {totalCount} matches</span>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => { setLoading(true); setPage((current) => current - 1); }} className="min-h-9 rounded border border-border px-3 font-semibold disabled:opacity-50">Previous</button>
            <button type="button" disabled={page >= lastPage} onClick={() => { setLoading(true); setPage((current) => current + 1); }} className="min-h-9 rounded border border-border px-3 font-semibold disabled:opacity-50">Next</button>
          </div>
        </div> : null}
      </div> : null}
    </div>
  );
}
