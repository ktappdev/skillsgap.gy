"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { PositionCard } from "@/components/shareable/position-card";
import type { PublicPositionSummary } from "@/lib/share/public-content";

type PositionDirectoryProps = {
  positions: PublicPositionSummary[];
};

function matchesPosition(position: PublicPositionSummary, query: string) {
  if (!query) return true;
  const searchableText = [
    position.title,
    position.description,
    position.location,
    position.employmentType ?? "",
    position.company.name,
  ].join(" ").toLocaleLowerCase();
  return searchableText.includes(query);
}

export function PositionDirectory({ positions }: PositionDirectoryProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredPositions = useMemo(
    () => positions.filter((position) => matchesPosition(position, normalizedQuery)),
    [normalizedQuery, positions],
  );

  return (
    <section className="mt-12" aria-labelledby="position-list-title">
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="position-list-title" className="text-2xl font-semibold tracking-tight text-foreground">
            Open positions
          </h2>
          <p className="mt-1 text-sm text-muted" aria-live="polite">
            {filteredPositions.length} {filteredPositions.length === 1 ? "position" : "positions"}
            {normalizedQuery ? ` matching “${query.trim()}”` : ""}
          </p>
        </div>
        <label className="w-full text-sm font-semibold text-foreground sm:max-w-xs">
          Search positions
          <input
            type="search"
            name="position-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try technician, Georgetown…"
            className="mt-2 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent"
          />
        </label>
      </div>

      {filteredPositions.length > 0 ? (
        <div id="positions-list" className="mt-6 grid gap-4 md:grid-cols-2">
          {filteredPositions.map((position) => <PositionCard key={position.id} position={position} />)}
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-border bg-surface p-6">
          <h3 className="text-lg font-semibold text-foreground">{positions.length === 0 ? "No public positions right now." : "No positions match that search."}</h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            {positions.length === 0
              ? "You can still build a route from your interests and starting point, then return when new roles are published."
              : "Try a broader search, or clear the search to see every published position."}
          </p>
          {normalizedQuery ? <button type="button" onClick={() => setQuery("")} className="mt-4 inline-flex min-h-11 items-center font-semibold text-accent underline-offset-4 hover:underline">Clear search</button> : positions.length === 0 ? <Link href="/i-want-to-become" className="mt-4 inline-flex min-h-11 items-center font-semibold text-accent underline-offset-4 hover:underline">Build a career route <span aria-hidden="true" className="ml-2">→</span></Link> : null}
        </div>
      )}
    </section>
  );
}
