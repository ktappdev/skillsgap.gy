import Link from "next/link";

import { ShareButton } from "@/components/shareable/share-button";
import { TrainingProvidersLink } from "@/components/shareable/training-providers-link";
import { buildPositionShareText } from "@/lib/share/messages";
import type { Match } from "@/lib/skillsgap-demo";

import { StatusPill } from "./milestone-path";

export function MatchCard({ match }: { match: Match }) {
  // `isDemo` marks a curated seed role, so the card would otherwise read like a
  // live vacancy. The full explanation lives on the opportunity page
  // (`opportunities/[roleId]/page.tsx`, the demo notice beneath the title); this
  // keeps its key clause visible on the card itself rather than behind a hover,
  // because a judge scanning the list never opens a tooltip.
  const remaining = Math.max(match.threshold - match.score, 0);
  const hasConfirmedStrengths = match.strengths.length > 0;

  return (
    <article className="rounded-lg border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{match.company}{match.isDemo ? " · Demo, not a live vacancy" : ""}</p>
          <h3 className="mt-2 text-lg font-semibold tracking-tight text-foreground">{match.title}</h3>
        </div>
        <StatusPill tone={match.eligible ? "success" : "accent"}>{match.score}% match</StatusPill>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted" aria-label={`${match.score}% match`}>
        <div className="h-full bg-accent" style={{ width: `${match.score}%` }} />
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">
        {match.eligible
          ? `Meets the ${match.threshold}% interview threshold. All mandatory requirements are met.`
          : remaining > 0
            ? `${remaining} points to the ${match.threshold}% interview threshold.`
            : "Match threshold met; required qualifications remain."}
      </p>

      <div className="mt-3 border-t border-border pt-3">
        {hasConfirmedStrengths ? (
          <ul className="flex flex-wrap gap-2" role="list" aria-label="Confirmed strengths">
            {match.strengths.slice(0, 2).map((strength) => (
              <li key={strength} className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-foreground">
                {strength}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm leading-6 text-muted">
            Confirm a CV translation above to shape this route.
          </p>
        )}
      </div>

      {match.gaps.length > 0 ? (
        <section className="mt-3 border-t border-border pt-3" aria-label="Training for requirements to verify">
          <p className="text-sm font-medium text-foreground">
            {match.gaps.length} {match.gaps.length === 1 ? "requirement" : "requirements"} to work toward
          </p>
          <ul className="mt-2 space-y-2" role="list">
            {match.gaps.map((gap) => (
              <li key={gap.id ?? `${gap.name}-${gap.type}`} className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-muted">{gap.name}</span>
                <TrainingProvidersLink qualification={gap.name} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Link href={`/matches/${match.id}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline">
          Open pathway <span aria-hidden="true" className="ml-1">→</span>
        </Link>
        {match.roleId ? <ShareButton url={`/opportunities/${match.roleId}`} title={match.title} text={buildPositionShareText({ title: match.title, company: match.company, location: null })} label="Share position" variant="light" /> : null}
      </div>
    </article>
  );
}
