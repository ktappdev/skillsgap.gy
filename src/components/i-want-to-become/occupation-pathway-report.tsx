import Link from "next/link";

import { normalizeSubjectName, type CsecResult } from "@/lib/i-want-to-become/catalog";
import type { OccupationPathwayAction } from "@/lib/i-want-to-become/guidance";
import type { PublicOccupationPathway } from "@/lib/i-want-to-become/occupations";

type OccupationPathwayReportProps = {
  pathway: PublicOccupationPathway;
  interests: string;
  selectedInterests: string[];
  results: CsecResult[];
  source: "live" | "fallback";
  onEdit: () => void;
};

const actionLabels: Record<OccupationPathwayAction["actionType"], string> = {
  learn: "Learn",
  practice: "Practise",
  register: "Register",
  find_work: "Find work",
  guidance: "Get guidance",
};

function verificationState(action: OccupationPathwayAction) {
  if (!action.isVerified) return { label: "Not yet verified", className: "text-amber-800" };
  const verifiedAt = Date.parse(`${action.lastVerifiedAt}T00:00:00Z`);
  const ageInDays = Number.isFinite(verifiedAt) ? Math.floor((Date.now() - verifiedAt) / 86_400_000) : 91;
  return ageInDays <= 90
    ? { label: `Checked ${action.lastVerifiedAt}`, className: "text-emerald-800" }
    : { label: `Needs checking · last checked ${action.lastVerifiedAt}`, className: "text-amber-800" };
}

function ActionCard({ action, position }: { action: OccupationPathwayAction; position: number }) {
  const verification = verificationState(action);
  return <li className="border border-border bg-surface p-5 shadow-sm" data-testid="pathway-action">
    <div className="flex gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-muted text-sm font-bold text-accent" aria-hidden="true">{position}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">{actionLabels[action.actionType]}</p>
          <span className={`text-xs font-semibold ${verification.className}`}>{verification.label}</span>
        </div>
        <h4 className="mt-2 text-lg font-semibold text-foreground">{action.title}</h4>
        <p className="mt-2 text-sm leading-6 text-muted">{action.instruction}</p>
        <p className="mt-3 border-l-2 border-accent/40 pl-3 text-sm leading-6 text-foreground"><span className="font-semibold">Why this helps:</span> {action.whyItHelps}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span className="font-semibold text-foreground">{action.organizationName}</span>
          {action.location ? <span>{action.location}</span> : null}
          {action.contactText ? <span>{action.contactText}</span> : null}
        </div>
        <a href={action.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" aria-label={`${action.title} — open official site in a new tab`}>
          Open official site <span aria-hidden="true" className="ml-2">↗</span>
        </a>
      </div>
    </div>
  </li>;
}

function TransferSummary({ pathway }: { pathway: PublicOccupationPathway }) {
  return <section className="mt-8 border-l-4 border-accent bg-surface-muted p-5" aria-labelledby="transfer-title">
    <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">How it transfers into oil and gas</p>
    <h3 id="transfer-title" className="mt-2 text-xl font-semibold tracking-tight">Your experience has a direction, not a promise</h3>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-foreground">{pathway.industryTransferSummary}</p>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Local-content work around this role</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {pathway.localContentCategories.length > 0 ? pathway.localContentCategories.map((category) => <li key={category} className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-foreground">{category}</li>) : <li className="text-sm text-muted">Ask a provider which local services connect to this work.</li>}
        </ul>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Example titles to search</p>
        <ul className="mt-3 space-y-1 text-sm text-foreground">
          {pathway.exampleTitles.length > 0 ? pathway.exampleTitles.map((title) => <li key={title}>• {title}</li>) : <li className="text-muted">No example title has been independently mapped yet.</li>}
        </ul>
      </div>
    </div>
  </section>;
}

function StartingPoint({ pathway, interests, selectedInterests, results }: { pathway: PublicOccupationPathway; interests: string; selectedInterests: string[]; results: CsecResult[] }) {
  const enteredSubjects = new Set(results.map((result) => normalizeSubjectName(result.subject)));
  return <section className="mt-8" aria-labelledby="starting-point-title">
    <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted">Your starting point</p>
    <h3 id="starting-point-title" className="mt-2 text-xl font-semibold tracking-tight">What you entered, kept separate from qualifications</h3>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">These details help you reflect and choose a next step. They do not create a job-match score or prove that you are qualified.</p>
    {results.length > 0 ? <ul className="mt-4 flex flex-wrap gap-2">{results.map((result) => <li key={`${result.subject}-${result.grade}`} className="rounded-full border border-border bg-surface-muted px-3 py-1.5 text-sm font-medium text-foreground">{result.subject}: Grade {result.grade}</li>)}</ul> : <p className="mt-4 text-sm text-muted">No CSEC/CXC results were added. You can still follow this route.</p>}
    {selectedInterests.length > 0 ? <p className="mt-4 text-sm text-foreground"><span className="font-semibold">You highlighted:</span> {selectedInterests.join(", ")}</p> : null}
    {interests.trim() ? <p className="mt-2 text-sm leading-6 text-muted"><span className="font-semibold text-foreground">Your note:</span> {interests.trim()}</p> : null}
    <div className="mt-5 border border-border bg-surface p-4">
      <p className="text-sm font-semibold text-foreground">Preparation subjects to explore</p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {pathway.preparationSubjects.map((subject) => {
          const confirmed = enteredSubjects.has(normalizeSubjectName(subject.subjectName));
          return <li key={subject.subjectName} className="flex gap-3 text-sm"><span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-xs font-bold ${confirmed ? "bg-accent text-white" : "border border-border text-muted"}`} aria-hidden="true">{confirmed ? "✓" : "→"}</span><span><span className="font-medium text-foreground">{subject.subjectName}</span><span className="ml-2 text-muted">{confirmed ? "listed by you" : "worth exploring"}</span><span className="mt-1 block leading-6 text-muted">{subject.guidanceNote}</span></span></li>;
        })}
      </ul>
    </div>
  </section>;
}

function VerificationNotice({ source }: { source: "live" | "fallback" }) {
  return <aside className="mt-8 border border-amber-200 bg-amber-50 p-5" aria-labelledby="verification-title">
    <h3 id="verification-title" className="text-sm font-semibold text-amber-950">Before you spend money or make a move</h3>
    <p className="mt-2 text-sm leading-6 text-amber-900">Training dates, fees, entry requirements, medical checks, offshore safety rules, and vacancies can change. Confirm the current details directly with the provider or employer. {source === "fallback" ? "You are viewing the locally reviewed catalogue while the live catalogue is unavailable." : "Each action includes the date it was last checked by SkillsGap.gy."}</p>
  </aside>;
}

export function OccupationPathwayReport({ pathway, interests, selectedInterests, results, source, onEdit }: OccupationPathwayReportProps) {
  const primaryActions = pathway.actions.filter((action) => action.isActive).slice(0, 3);
  const additionalActions = pathway.actions.filter((action) => action.isActive).slice(3);
  return <section className="border border-border bg-surface p-5 shadow-sm sm:p-8" aria-labelledby="occupation-plan-title">
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Possible petroleum occupation</p>
    <h2 id="occupation-plan-title" className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">Explore a route toward {pathway.title}</h2>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">This catalogue profile shows a possible direction in Guyana&apos;s petroleum value chain. It is not a live vacancy, qualification decision, or promise of employment.</p>

    <section className="mt-8 grid gap-3 sm:grid-cols-3" aria-label="Occupation details">
      <div className="border border-border bg-surface-muted p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">ISCO-08</p><p className="mt-2 text-lg font-semibold text-foreground">{pathway.isco08Code}</p><p className="text-sm text-muted">{pathway.isco08Level} group</p></div>
      <div className="border border-border bg-surface-muted p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Role family</p><p className="mt-2 text-lg font-semibold text-foreground">{pathway.roleFamily}</p><p className="text-sm text-muted">Possible work family</p></div>
      <div className="border border-border bg-surface-muted p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Value chain</p><p className="mt-2 text-lg font-semibold capitalize text-foreground">{pathway.valueChainStages.join(" · ")}</p><p className="text-sm text-muted">Where this work can support operations</p></div>
    </section>

    <TransferSummary pathway={pathway} />
    <StartingPoint pathway={pathway} interests={interests} selectedInterests={selectedInterests} results={results} />

    <section className="mt-8" aria-labelledby="next-moves-title">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Your next three moves</p>
      <h3 id="next-moves-title" className="mt-2 text-xl font-semibold tracking-tight">Small actions that move this from interest to evidence</h3>
      <ol className="mt-5 space-y-3">
        {primaryActions.map((action, index) => <ActionCard key={action.id} action={action} position={index + 1} />)}
      </ol>
      {primaryActions.length === 0 ? <p className="mt-4 border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">No verified action is published for this occupation yet. Start with the source study and ask a recognised provider for a current route.</p> : null}
    </section>

    {additionalActions.length > 0 ? <section className="mt-8" aria-labelledby="more-actions-title"><p className="text-xs font-bold uppercase tracking-[0.15em] text-muted">More official places to continue</p><h3 id="more-actions-title" className="mt-2 text-xl font-semibold tracking-tight">Keep exploring when you are ready</h3><ul className="mt-5 space-y-3">{additionalActions.map((action, index) => <ActionCard key={action.id} action={action} position={index + 4} />)}</ul></section> : null}

    <VerificationNotice source={source} />
    <div className="mt-8 border-t border-border pt-6"><p className="text-sm leading-6 text-muted">Source: {pathway.sourceSummary}, {pathway.sourceLocator ?? "occupation classification"}. Read the source and confirm current requirements before making education or training decisions.</p><div className="mt-4 flex flex-wrap gap-3"><a href={pathway.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Read the source ↗</a><Link href="/signup" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Build my verified profile</Link><button type="button" onClick={onEdit} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Edit my starting point</button></div></div>
  </section>;
}
