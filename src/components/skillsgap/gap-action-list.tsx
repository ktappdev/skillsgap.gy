import type { Match } from "@/lib/skillsgap-demo";

import { StatusPill } from "@/components/skillsgap/milestone-path";
import { TrainingPlanButton } from "@/components/skillsgap/training-plan-button";

type Gap = Match["gaps"][number];

function GapAction({ gap, isDemo, isFirst = false }: { gap: Gap; isDemo: boolean; isFirst?: boolean }) {
  return (
    <article className="border-t border-border py-5 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {isFirst ? <p className="mb-1 text-xs font-bold uppercase tracking-[0.15em] text-accent">Start here</p> : null}
          <h3 className="text-sm font-semibold text-foreground">{gap.name}</h3>
          <p className="mt-1 text-sm text-muted">{gap.type}</p>
        </div>
        <StatusPill>{gap.mandatory ? "Mandatory" : "Required"}</StatusPill>
      </div>

      {gap.training ? (
        <div className="mt-4">
          {isDemo ? <p className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-muted">Illustrative demo program</p> : null}
          <p className="text-sm font-semibold text-foreground">{gap.training}</p>
          {gap.trainingDuration ? <p className="mt-1 text-sm font-medium text-foreground">{gap.trainingDuration}</p> : null}
          {gap.trainingDescription ? <p className="mt-1 text-sm leading-6 text-muted">{gap.trainingDescription}</p> : null}
          {gap.projectedScore !== undefined ? <p className="mt-2 text-sm font-semibold text-accent">Projected match after confirmation: {gap.projectedScore}%</p> : null}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {gap.trainingUrl?.startsWith("https://") ? (
              <a href={gap.trainingUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong">
                Check training <span className="ml-1" aria-hidden="true">↗</span>
              </a>
            ) : null}
            <TrainingPlanButton qualification={gap.name} gapId={gap.id} initialStatus={gap.status} />
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-muted">No verified local route is listed yet. Ask the provider or employer what evidence they accept.</p>
      )}
    </article>
  );
}

export function GapActionList({ gaps, isDemo = false }: { gaps: Match["gaps"]; isDemo?: boolean }) {
  const [firstGap, ...otherGaps] = gaps;
  if (!firstGap) return null;

  return (
    <div className="mt-6 border-y border-border">
      <GapAction gap={firstGap} isDemo={isDemo} isFirst />
      {otherGaps.length > 0 ? (
        <details className="border-t border-border py-4">
          <summary className="cursor-pointer text-sm font-semibold text-accent">
            See {otherGaps.length} more {otherGaps.length === 1 ? "requirement" : "requirements"}
          </summary>
          <div className="mt-4">
            {otherGaps.map((gap) => <GapAction key={gap.id ?? `${gap.name}-${gap.type}`} gap={gap} isDemo={isDemo} />)}
          </div>
        </details>
      ) : null}
    </div>
  );
}
