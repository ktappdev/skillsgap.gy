import Link from "next/link";

import { TrainingProvidersLink } from "@/components/shareable/training-providers-link";
import type { ApplicantProgress } from "@/lib/skillsgap/queries";
import type { Match } from "@/lib/skillsgap-demo";

type ApplicantOverviewProps = {
  name: string;
  progress: ApplicantProgress;
  matches: Match[];
  usingDemoMatches: boolean;
  isProcessing: boolean;
};

type StageState = "complete" | "current" | "next";

export function ApplicantOverview({ name, progress, matches, usingDemoMatches, isProcessing }: ApplicantOverviewProps) {
  const topMatch = matches[0] ?? null;
  const nextGap = topMatch?.gaps.find((gap) => gap.status !== "completed" && gap.status !== "resolved") ?? null;
  const confirmedSkillCount = usingDemoMatches
    ? new Set(matches.flatMap((match) => match.strengths)).size
    : progress.qualifications.length + progress.experience.length;
  const routeCount = usingDemoMatches ? matches.length : progress.visibleRoleCount;
  const highestMatch = topMatch?.score ?? 0;
  const hasProfile = usingDemoMatches || confirmedSkillCount > 0;
  const hasTraining = Boolean(nextGap?.trainingProgramId);
  const hasInterviewPath = Boolean(topMatch?.eligible);
  const stageStates: Array<{ number: string; title: string; detail: string; state: StageState }> = [
    {
      number: "01",
      title: "Your experience",
      detail: hasProfile ? `${confirmedSkillCount} confirmed signals` : "Upload your CV to begin",
      state: hasProfile ? "complete" : "current",
    },
    {
      number: "02",
      title: "Best-fit route",
      detail: topMatch ? `${highestMatch}% closest match` : "Routes appear after review",
      state: matches.length > 0 ? "complete" : "next",
    },
    {
      number: "03",
      title: "Skill to build",
      detail: nextGap?.name ?? "A clear next step from your gaps",
      state: hasTraining ? "current" : matches.length > 0 ? "current" : "next",
    },
    {
      number: "04",
      title: "Interview momentum",
      detail: hasInterviewPath ? "A route is ready to pursue" : "Close the next gap to move closer",
      state: hasInterviewPath ? "complete" : "next",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Applicant dashboard</p>
          <p className="mt-2 text-sm text-muted">A clear view of your next move in Guyana&apos;s energy economy.</p>
        </div>
        {isProcessing ? <span className="rounded-full border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted">Your CV is being reviewed</span> : null}
      </header>

      <section className="overflow-hidden rounded-lg border border-accent bg-accent text-white" aria-labelledby="overview-title">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.65fr)] lg:p-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Skills → opportunities → training</p>
            <h1 id="overview-title" className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Turn what you already know into your next energy-sector move, {name}.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
              SkillsGap.gy connects your experience to real local-content opportunities, then makes the next skill or qualification easy to act on.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-md bg-white px-4 text-sm font-semibold text-accent transition hover:bg-surface-muted">
                Review my pathway <span aria-hidden="true" className="ml-2">→</span>
              </Link>
              <Link href="/training" className="inline-flex min-h-11 items-center rounded-md border border-white/40 px-4 text-sm font-semibold text-white transition hover:bg-white/10">
                Explore training
              </Link>
            </div>
          </div>

          <div className="border border-white/20 bg-accent-strong/50 p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">Closest energy route</p>
            {topMatch ? (
              <>
                <p className="mt-5 text-5xl font-semibold tracking-tight tabular-nums">{highestMatch}%</p>
                <p className="mt-2 text-base font-semibold">{topMatch.title}</p>
                <p className="mt-1 text-sm text-white/70">{topMatch.company}</p>
                <p className="mt-5 border-t border-white/20 pt-4 text-sm leading-6 text-white/80">
                  {topMatch.eligible ? "You have met the score and mandatory requirements for this route." : nextGap ? `${nextGap.name} is the next step that can lift this route.` : "Keep confirming your profile to sharpen this route."}
                </p>
              </>
            ) : (
              <>
                <p className="mt-5 text-2xl font-semibold">Your route is waiting</p>
                <p className="mt-2 text-sm leading-6 text-white/80">Upload a CV or confirm your experience to see where you can move next.</p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="snapshot-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Your snapshot</p>
            <h2 id="snapshot-heading" className="mt-2 text-2xl font-semibold tracking-tight text-foreground">The important things at a glance</h2>
          </div>
          {usingDemoMatches ? <span className="rounded-full bg-surface-muted px-3 py-1.5 text-xs font-semibold text-muted">Curated demo pathway</span> : null}
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <OverviewMetric label="Skills confirmed" value={String(confirmedSkillCount)} detail={usingDemoMatches ? "Curated mechanical and safety strengths" : progress.qualifications.length > 0 ? `${progress.qualifications.length} qualifications · ${progress.experience.length} experience records` : "Confirm your profile to improve your matches"} />
          <OverviewMetric label="Routes ranked" value={String(routeCount)} detail={routeCount === 0 ? "Upload your CV to see local opportunities" : usingDemoMatches ? "Curated energy-sector routes" : "Approved energy and local-content roles"} />
          <OverviewMetric label="Highest match" value={topMatch ? `${highestMatch}%` : "—"} detail={topMatch ? topMatch.title : "No match calculated yet"} tone="accent" />
          <OverviewMetric label="Priority gaps" value={String(nextGap ? topMatch?.gaps.filter((gap) => gap.status !== "completed" && gap.status !== "resolved").length ?? 0 : 0)} detail={nextGap ? "Start with the first gap below" : "Your next gap appears after matching"} tone="warning" />
        </dl>
      </section>

      <section className="mt-8 border border-border bg-surface p-5 sm:p-6" aria-labelledby="route-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Your route, made visible</p>
            <h2 id="route-heading" className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Every step points to the next one</h2>
          </div>
          <Link href="/dashboard" className="inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline">Open my pathway <span aria-hidden="true" className="ml-2">→</span></Link>
        </div>
        <ol className="mt-6 grid gap-3 md:grid-cols-4" aria-label="Applicant pathway stages">
          {stageStates.map((stage) => <PathwayStage key={stage.number} {...stage} />)}
        </ol>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <section aria-labelledby="matches-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Closest opportunities</p>
              <h2 id="matches-heading" className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Where your experience can take you</h2>
            </div>
            <Link href="/opportunities" className="inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline">Browse all roles <span aria-hidden="true" className="ml-2">→</span></Link>
          </div>
          {topMatch ? (
            <div className="mt-5 space-y-3">
              <OverviewMatch match={topMatch} featured />
              {matches.slice(1).map((match) => <OverviewMatch key={match.id} match={match} />)}
            </div>
          ) : (
            <div className="mt-5 border border-dashed border-border bg-surface p-6">
              <h3 className="text-lg font-semibold text-foreground">Your first routes will appear here</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted">Upload a private CV or confirm a career route so we can compare your strengths with opportunities in Guyana&apos;s energy industry.</p>
              <Link href="/dashboard" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline">Go to my pathway <span aria-hidden="true" className="ml-2">→</span></Link>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <NextStepCard gap={nextGap} topMatch={topMatch} />
          <section className="border border-border bg-surface p-5" aria-labelledby="momentum-heading">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Keep moving</p>
            <h2 id="momentum-heading" className="mt-2 text-xl font-semibold tracking-tight text-foreground">Momentum matters</h2>
            <p className="mt-2 text-sm leading-6 text-muted">One confirmed skill, one course, or one interview slot can change the route in front of you.</p>
            <Link href={hasInterviewPath ? "/interviews" : "/dashboard"} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline">
              {hasInterviewPath ? "See interview options" : "Strengthen my profile"} <span aria-hidden="true" className="ml-2">→</span>
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}

function OverviewMetric({ label, value, detail, tone = "neutral" }: { label: string; value: string; detail: string; tone?: "neutral" | "accent" | "warning" }) {
  const valueClass = tone === "accent" ? "text-accent" : tone === "warning" ? "text-amber-700" : "text-foreground";
  return (
    <div className="border border-border bg-surface p-5">
      <dt className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className={`mt-3 text-3xl font-semibold tracking-tight tabular-nums ${valueClass}`}>{value}</dd>
      <p className="mt-2 text-sm leading-5 text-muted">{detail}</p>
    </div>
  );
}

function PathwayStage({ number, title, detail, state }: { number: string; title: string; detail: string; state: StageState }) {
  const markerClass = state === "complete" ? "bg-accent text-white" : state === "current" ? "border-2 border-accent bg-surface text-accent" : "border border-border bg-surface-muted text-muted";
  return (
    <li className="border border-border bg-surface-muted p-4">
      <div className="flex items-start gap-3">
        <span className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ${markerClass}`} aria-hidden="true">{state === "complete" ? "✓" : number}</span>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm leading-5 text-muted">{detail}</p>
        </div>
      </div>
    </li>
  );
}

function OverviewMatch({ match, featured = false }: { match: Match; featured?: boolean }) {
  const remaining = Math.max(match.threshold - match.score, 0);
  return (
    <article className={`border border-border bg-surface p-5 ${featured ? "border-accent/40" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{match.company}{match.isDemo ? " · Curated route" : ""}</p>
          <h3 className="mt-2 text-lg font-semibold tracking-tight text-foreground">{match.title}</h3>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${match.eligible ? "bg-emerald-50 text-emerald-800" : "bg-surface-muted text-accent"}`}>{match.score}% match</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-muted" aria-label={`${match.score}% match`}>
        <div className="h-full bg-accent" style={{ width: `${match.score}%` }} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm leading-6 text-muted">{match.eligible ? `Meets the ${match.threshold}% interview threshold. All mandatory requirements are met.` : remaining > 0 ? `${remaining} points to the ${match.threshold}% interview threshold.` : "Score met; review mandatory requirements."}</p>
        <div className="flex flex-wrap items-center gap-3">
          {match.gaps[0] ? <TrainingProvidersLink qualification={match.gaps[0].name} /> : null}
          <Link href={`/matches/${match.id}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline">View route <span aria-hidden="true" className="ml-2">→</span></Link>
        </div>
      </div>
    </article>
  );
}

function NextStepCard({ gap, topMatch }: { gap: Match["gaps"][number] | null; topMatch: Match | null }) {
  const description = gap?.training
    ? `${gap.training}${gap.trainingDuration ? ` · ${gap.trainingDuration}` : ""}`
    : gap
      ? "Review this requirement in your pathway and choose a verified route."
      : topMatch
        ? "Review your confirmed profile and keep this route moving."
        : "Choose one clear action and let the pathway get more specific.";

  return (
    <section className="border border-accent/30 bg-teal-50/40 p-5" aria-labelledby="next-step-heading">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Recommended next step</p>
      <h2 id="next-step-heading" className="mt-2 text-xl font-semibold tracking-tight text-foreground">{gap ? gap.name : topMatch ? "Review your confirmed profile" : "Start with your experience"}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
      {gap ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <TrainingProvidersLink qualification={gap.name} />
          {gap.trainingProgramId ? <Link href={`/training/${gap.trainingProgramId}`} className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong">View recommended course <span aria-hidden="true" className="ml-2">→</span></Link> : null}
        </div>
      ) : (
        <Link href="/dashboard" className="mt-4 inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong">Open my pathway <span aria-hidden="true" className="ml-2">→</span></Link>
      )}
    </section>
  );
}
