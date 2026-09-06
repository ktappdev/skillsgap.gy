import Link from "next/link";

import { ShareButton } from "@/components/shareable/share-button";
import { buildPositionShareText } from "@/lib/share/messages";
import type { Match } from "@/lib/skillsgap-demo";

import { StatusPill } from "./milestone-path";

export function MatchCard({ match }: { match: Match }) {
  const remaining = Math.max(match.threshold - match.score, 0);
  const hasConfirmedStrengths = match.strengths.length > 0;
  const opportunityLabel = match.isDemo ? "Curated demo pathway" : "Company-published role";

  return (
    <article className="border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted">{match.company}</p>
          <p className="mt-2 text-xs font-semibold text-accent">{opportunityLabel}</p>
          <h3 className="mt-2 text-lg font-semibold tracking-tight text-foreground">{match.title}</h3>
        </div>
        <StatusPill tone={match.eligible ? "success" : "accent"}>{match.score}% match</StatusPill>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-muted" aria-label={`${match.score}% match`}>
        <div className="h-full bg-accent" style={{ width: `${match.score}%` }} />
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">
        {match.eligible
          ? "You meet this role's score threshold and mandatory requirements."
          : remaining > 0
            ? `${remaining}% to this role's interview threshold.`
            : "The score threshold is met; review any mandatory requirements below."}
      </p>

      <div className="mt-5 border-t border-border pt-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted">What counts today</p>
          <p className="text-xs text-muted">{hasConfirmedStrengths ? "Confirmed" : "Pending your review"}</p>
        </div>
        {hasConfirmedStrengths ? (
          <ul className="mt-2 flex flex-wrap gap-2" role="list">
            {match.strengths.slice(0, 2).map((strength) => (
              <li key={strength} className="bg-surface-muted px-2.5 py-1 text-xs font-medium text-foreground">
                {strength}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm leading-6 text-muted">
            No strengths are confirmed yet. Choose a possible CV translation above before it affects this route.
          </p>
        )}
      </div>

      {match.gaps.length > 0 ? (
        <p className="mt-4 text-sm font-medium text-foreground">
          {match.gaps.length} {match.gaps.length === 1 ? "requirement" : "requirements"} still to verify
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link href={`/matches/${match.id}`} className="inline-flex min-h-10 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline">
          See your pathway <span aria-hidden="true" className="ml-1">→</span>
        </Link>
        {match.roleId ? <ShareButton url={`/opportunities/${match.roleId}`} title={match.title} text={buildPositionShareText({ title: match.title, company: match.company, location: null })} label="Share position" variant="light" /> : null}
      </div>
    </article>
  );
}
