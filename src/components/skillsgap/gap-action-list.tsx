import Link from "next/link";

import { ShareButton } from "@/components/shareable/share-button";
import { TrainingProvidersLink } from "@/components/shareable/training-providers-link";
import { buildCourseShareText } from "@/lib/share/messages";
import type { Match } from "@/lib/skillsgap-demo";

import { StatusPill } from "@/components/skillsgap/milestone-path";
import { TrainingPlanButton } from "@/components/skillsgap/training-plan-button";

type Gap = Match["gaps"][number];

function GapAction({ gap, isDemo, isFirst = false }: { gap: Gap; isDemo: boolean; isFirst?: boolean }) {
  return (
    <article className="border-t border-border py-5 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {isFirst ? <p className="mb-1 text-sm font-semibold text-accent">Start here</p> : null}
          <h3 className="text-sm font-semibold text-foreground">{gap.name}</h3>
          <p className="mt-1 text-sm text-muted">{gap.type}</p>
        </div>
        <StatusPill>{gap.mandatory ? "Required" : "Preferred"}</StatusPill>
      </div>

      {gap.training ? (
        <div className="mt-3">
          {isDemo ? <p className="mb-1 text-xs font-semibold text-muted">Demo program</p> : null}
          <p className="text-sm font-semibold text-foreground">{gap.training}</p>
          {gap.trainingDuration ? <p className="mt-1 text-sm font-medium text-foreground">{gap.trainingDuration}</p> : null}
          {gap.trainingDescription ? <p className="mt-1 text-sm leading-6 text-muted">{gap.trainingDescription}</p> : null}
          {gap.projectedScore !== undefined ? <p className="mt-2 text-sm font-semibold text-accent">Match after confirmation: {gap.projectedScore}%</p> : null}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {gap.trainingProgramId ? <Link href={`/training/${gap.trainingProgramId}`} className="inline-flex min-h-11 items-center rounded-md border border-accent px-4 text-sm font-semibold text-accent hover:bg-surface-muted">View course <span className="ml-1" aria-hidden="true">→</span></Link> : null}
            {gap.trainingProgramId ? <ShareButton url={`/training/${gap.trainingProgramId}`} title={gap.training ?? "Local training route"} text={buildCourseShareText({ name: gap.training ?? "Local training route", provider: gap.training?.split(" · ").slice(1).join(" · ") || "a verified local provider" })} label="Share course" variant="light" /> : null}
            {gap.trainingUrl?.startsWith("https://") ? (
              <a href={gap.trainingUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong">
                Check training <span className="ml-1" aria-hidden="true">↗</span>
              </a>
            ) : null}
            <TrainingPlanButton qualification={gap.name} gapId={gap.id} initialStatus={gap.status} />
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-muted">No verified program is mapped to this requirement yet. Browse other training options or ask the employer what evidence they accept.</p>
      )}
      <div className="mt-3">
        <TrainingProvidersLink qualification={gap.name} />
      </div>
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
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-accent">
            {otherGaps.length} more {otherGaps.length === 1 ? "requirement" : "requirements"}
          </summary>
          <div className="mt-4">
            {otherGaps.map((gap) => <GapAction key={gap.id ?? `${gap.name}-${gap.type}`} gap={gap} isDemo={isDemo} />)}
          </div>
        </details>
      ) : null}
    </div>
  );
}
