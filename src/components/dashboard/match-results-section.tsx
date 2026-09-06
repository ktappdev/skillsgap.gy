"use client";

import Link from "next/link";

import { useMatchRecalculation } from "@/components/dashboard/match-recalculation-context";
import { MatchCard } from "@/components/skillsgap/match-card";
import { StatusPill } from "@/components/skillsgap/milestone-path";
import type { Match } from "@/lib/skillsgap-demo";

type MatchResultsSectionProps = {
  matches: Match[];
  roleLabel: string;
  isRecalculating: boolean;
  recalculationError: string | null;
};

export function MatchResultsSection({ matches, roleLabel, isRecalculating, recalculationError }: MatchResultsSectionProps) {
  const optimisticState = useMatchRecalculation()?.state ?? { status: "idle" as const };
  const loading = optimisticState.status === "loading" || isRecalculating;
  const error = optimisticState.status === "error" ? optimisticState.message : recalculationError;

  return (
    <section id="matches-area" tabIndex={-1} className="scroll-mt-6 focus:outline-none" aria-labelledby="matches-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Closest opportunities</p>
          <h2 id="matches-heading" className="mt-2 text-2xl font-semibold tracking-tight">Your best-fit routes</h2>
        </div>
        <StatusPill tone="accent">{loading ? "Updating" : roleLabel}</StatusPill>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">These routes are ranked from your confirmed profile. You do not need to know the job title first.</p>

      {loading ? <MatchLoadingState /> : error ? <MatchErrorState message={error} /> : matches.length > 0 ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">{matches.map((match) => <MatchCard key={match.id} match={match} />)}</div>
      ) : <MatchEmptyState />}
    </section>
  );
}

function MatchLoadingState() {
  return (
    <div className="mt-5 rounded-lg border border-accent/30 bg-teal-50/50 p-5" role="status" aria-live="polite" aria-busy="true">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 size-5 shrink-0 animate-spin rounded-full border-2 border-accent/25 border-t-accent motion-reduce:animate-none" aria-hidden="true" />
        <div>
          <h3 className="font-semibold text-foreground">Updating your matches</h3>
          <p className="mt-1 text-sm leading-6 text-muted">We&apos;re confirming your selected skills and comparing them with current roles. This section will update automatically.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2" aria-hidden="true">
        <div className="h-28 animate-pulse rounded-lg bg-white/80 motion-reduce:animate-none" />
        <div className="h-28 animate-pulse rounded-lg bg-white/80 motion-reduce:animate-none" />
      </div>
    </div>
  );
}

function MatchErrorState({ message }: { message: string }) {
  return (
    <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-5" role="alert">
      <h3 className="font-semibold text-red-900">Your skills were saved, but the matches did not finish updating.</h3>
      <p className="mt-2 text-sm leading-6 text-red-800">{message}</p>
      <Link href="#skills-review" className="mt-3 inline-flex min-h-11 items-center font-semibold text-red-900 underline-offset-4 hover:underline">Review your confirmed skills</Link>
    </div>
  );
}

function MatchEmptyState() {
  return (
    <div className="mt-5 rounded-lg border border-dashed border-border bg-surface p-5">
      <h3 className="font-semibold text-foreground">No matching routes yet</h3>
      <p className="mt-2 text-sm leading-6 text-muted">We finished checking your confirmed profile. Add another relevant skill above to widen the roles we can compare.</p>
      <Link href="#skills-review" className="mt-3 inline-flex min-h-11 items-center font-semibold text-accent underline-offset-4 hover:underline">Review confirmed skills</Link>
    </div>
  );
}
