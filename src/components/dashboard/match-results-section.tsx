"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useMatchRecalculation } from "@/components/dashboard/match-recalculation-context";
import { MatchCard } from "@/components/skillsgap/match-card";
import { StatusPill } from "@/components/skillsgap/milestone-path";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import type { Match } from "@/lib/skillsgap-demo";

// A recalculation waits 0-20s for the processor to claim the job, spends ~0.3s
// in SQL, then takes up to 5s more before a dashboard refresh shows the new
// rows. 75s is roughly three times that worst case, so a job still queued or
// processing past this point has stopped being believable: the applicant gets
// the recoverable error affordance instead of an endless spinner.
const staleRecalculationMs = 75_000;

const staleRecalculationTitle = "Your matches are still updating.";

const staleRecalculationMessage = "Usually this takes under a minute. Your confirmed skills are saved, and the routes below may be slightly out of date. Review a confirmed skill to start a fresh update.";

type MatchResultsSectionProps = {
  matches: Match[];
  roleLabel: string;
  isRecalculating: boolean;
  recalculationStartedAt: string | null;
  recalculationError: string | null;
};

export function MatchResultsSection({ matches, roleLabel, isRecalculating, recalculationStartedAt, recalculationError }: MatchResultsSectionProps) {
  const optimisticState = useMatchRecalculation()?.state ?? { status: "idle" as const };
  const optimisticLoading = optimisticState.status === "loading";
  const optimisticError = optimisticState.status === "error" ? optimisticState.message : null;
  const stale = useStaleRecalculation(recalculationStartedAt, isRecalculating);
  const refreshing = optimisticLoading || isRecalculating;
  const updating = refreshing && !stale;
  const error = optimisticError ?? recalculationError ?? (stale ? staleRecalculationMessage : null);
  // Only the timer-driven bound makes this a "still running" report; a real
  // failure message keeps the failure wording.
  const errorTitle = stale && !optimisticError && !recalculationError ? staleRecalculationTitle : undefined;
  // The rule label is owned by `dashboard/page.tsx`: it reads "Top N of M roles"
  // only when the real list was capped to the three highest scores, and it reads
  // "Demo pathways" for the static demo fallback, which is a fixed three-card
  // sample rather than a capped slice of a longer list. Keying the cap note on
  // the cap wording keeps the note and the pill in agreement, and fails closed:
  // if that label is ever reworded, the note is dropped instead of claiming a cap
  // the shown list may not have.
  const listIsCapped = roleLabel.startsWith("Top ");

  // The ranked list is never unmounted while a recalculation is in flight. The
  // recalculation runs as one transaction (marks matches `stale`, upserts them
  // back to `current`), so a refresh can only ever see the old list or the new
  // one — there is nothing to hold on to and no reason to hide it.

  return (
    <section
      id="matches-area"
      tabIndex={-1}
      className="scroll-mt-6 focus:outline-none"
      aria-labelledby="matches-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Closest opportunities</p>
          <h2 id="matches-heading" className="mt-2 text-2xl font-semibold tracking-tight">Your best-fit routes</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone="accent">{roleLabel}</StatusPill>
          {updating ? <UpdatingPill /> : null}
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">These routes are ranked from your confirmed profile. You do not need to know the job title first.</p>

      {matches.length > 0 ? (
        <>
          <p className="mt-3 text-sm leading-6 text-muted">Your match is the share of a role&apos;s requirements you have confirmed, weighted by how much each requirement counts. It is calculated per role, so percentages are not comparable between roles.</p>
          {listIsCapped ? (
            <p className="mt-2 text-sm leading-6 text-muted">This list shows your {matches.length} highest-scoring {matches.length === 1 ? "role" : "roles"}. You may match more roles than are shown here.</p>
          ) : null}
        </>
      ) : null}

      {updating && matches.length === 0 ? <MatchLoadingState /> : error && matches.length === 0 ? <MatchErrorState message={error} title={errorTitle} /> : matches.length > 0 ? (
        <>
          {error ? <MatchErrorState message={error} title={errorTitle} /> : null}
          <div className="mt-5 grid gap-4 xl:grid-cols-2" aria-busy={updating || undefined}>
            {matches.map((match) => <MatchCard key={match.id} match={match} />)}
          </div>
        </>
      ) : <MatchEmptyState />}
    </section>
  );
}

// A live, non-destructive indicator: the ranked list keeps full contrast and
// stays navigable while this pill reports that new scores are on the way.
// Dimming the cards was rejected — it drops the muted body text below 4.5:1.
function UpdatingPill() {
  return (
    <span role="status" className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-teal-50/50 px-2.5 py-1 text-xs font-semibold text-accent">
      <Spinner size="sm" />
      Updating matches
    </span>
  );
}

// Flips to the stale state on a timer so the UI recovers at 75s even when the
// refresh loop keeps returning the same long-running job. The deadline is
// derived from the job's own timestamp instead of a mirror of it in state, so
// a new job resets the clock without an extra render.
function useStaleRecalculation(startedAt: string | null, isRecalculating: boolean) {
  const [checkedAt, setCheckedAt] = useState(0);
  const startedTime = startedAt ? Date.parse(startedAt) : Number.NaN;
  const stale = isRecalculating && !Number.isNaN(startedTime) && checkedAt >= startedTime + staleRecalculationMs;

  useEffect(() => {
    if (!isRecalculating || Number.isNaN(startedTime)) return;

    const remaining = Math.max(0, startedTime + staleRecalculationMs - Date.now());
    const timer = window.setTimeout(() => {
      setCheckedAt(Date.now());
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [isRecalculating, startedTime]);

  return stale;
}

function MatchLoadingState() {
  return (
    <div className="mt-5 rounded-lg border border-accent/30 bg-teal-50/50 p-5" role="status" aria-busy="true">
      <div className="flex items-start gap-3">
        <Spinner className="mt-0.5" />
        <div>
          <h3 className="font-semibold text-foreground">Updating your matches</h3>
          <p className="mt-1 text-sm leading-6 text-muted">We&apos;re confirming your selected skills and comparing them with current roles. This section will update automatically.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2" aria-hidden="true">
        <Skeleton kind="panel" tone="raised" className="h-28" />
        <Skeleton kind="panel" tone="raised" className="h-28" />
      </div>
    </div>
  );
}

function MatchErrorState({ message, title = "Your skills were saved, but the matches did not finish updating." }: { message: string; title?: string }) {
  return (
    <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-5" role="alert">
      <h3 className="font-semibold text-red-900">{title}</h3>
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
