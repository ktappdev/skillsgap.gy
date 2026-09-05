import Link from "next/link";

import { supportingSubjects, type CareerPathway, type CsecResult } from "@/lib/i-want-to-become/catalog";

type GuidedPathwayPlanProps = {
  pathway: CareerPathway;
  results: CsecResult[];
  onEdit: () => void;
};

const providerLinks = [
  ["Government Technical Institute", "https://www.education.gov.gy/en/index.php/moe-contacts/36-tertiary-institutions/253-government-technical-institute"],
  ["Board of Industrial Training", "https://srms.bit.gov.gy/"],
  ["3t Global Guyana", "https://www.3tglobal.com/about/our-locations/guyana/"],
] as const;

export function GuidedPathwayPlan({ pathway, results, onEdit }: GuidedPathwayPlanProps) {
  const subjects = supportingSubjects(pathway, results);
  return <section className="border border-border bg-surface p-5 shadow-sm sm:p-8" aria-labelledby="plan-title">
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Your starting plan</p>
    <h2 id="plan-title" className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">A route toward {pathway.title}</h2>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">This is a career-planning guide, not a job application. Your CSEC/CXC results can help you prepare; they are not professional qualifications or a job-match score.</p>

    <section className="mt-8 border-l-4 border-accent bg-surface-muted p-5" aria-labelledby="subjects-title">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">A useful foundation</p>
      <h3 id="subjects-title" className="mt-2 text-xl font-semibold tracking-tight">Subjects that can support this direction</h3>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {subjects.map(({ subject, confirmed }) => <li key={subject} className="flex items-center gap-2 text-sm"><span aria-hidden="true" className={`grid size-5 place-items-center rounded-full text-xs font-bold ${confirmed ? "bg-accent text-white" : "border border-border text-muted"}`}>{confirmed ? "✓" : "→"}</span><span className="font-medium text-foreground">{subject}</span><span className="text-muted">{confirmed ? "listed by you" : "worth exploring"}</span></li>)}
      </ul>
      {results.length === 0 ? <p className="mt-4 text-sm text-muted">Add your results whenever you have them. Your plan is still a useful place to begin.</p> : null}
    </section>

    <section className="mt-8" aria-labelledby="steps-title">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted">Practical next steps</p>
      <h3 id="steps-title" className="mt-2 text-xl font-semibold tracking-tight">Build the requirements one at a time</h3>
      <ol className="mt-5 space-y-3">
        {pathway.requirements.map((requirement, index) => <li key={requirement.name} className="border border-border p-4"><div className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-muted text-sm font-bold text-accent">{index + 1}</span><div><div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold text-foreground">{requirement.name}</h4>{requirement.mandatory ? <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-accent">Required for this role</span> : null}</div><p className="mt-1 text-sm leading-6 text-muted">{requirement.detail}</p>{requirement.minimumYears ? <p className="mt-2 text-sm font-medium text-foreground">Plan for at least {requirement.minimumYears} year{requirement.minimumYears === 1 ? "" : "s"} of relevant experience.</p> : null}{requirement.training ? <p className="mt-2 text-sm font-medium text-accent">Training to explore: {requirement.training}</p> : <p className="mt-2 text-sm text-muted">Ask a recognised provider about the current route before enrolling.</p>}</div></div></li>)}
      </ol>
    </section>

    <section className="mt-8" aria-labelledby="provider-links-title">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Official places to continue</p>
      <h3 id="provider-links-title" className="mt-2 text-xl font-semibold tracking-tight">Confirm the current route directly</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {providerLinks.map(([name, url]) => <a key={name} href={url} target="_blank" rel="noreferrer" className="border border-border bg-surface p-4 text-sm font-semibold text-foreground hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{name} <span aria-hidden="true">↗</span></a>)}
      </div>
      <p className="mt-4 text-sm leading-6 text-muted">Training availability and entry requirements can change. Ask the provider about intake, cost, duration, and any medical or safety requirements before spending money.</p>
    </section>

    <section className="mt-8 border border-border bg-surface-muted p-5" aria-labelledby="account-title">
      <h3 id="account-title" className="text-lg font-semibold tracking-tight">Ready to build your full pathway?</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted">Create an account when you are ready to add verified training, experience, and a CV. We have not saved this plan or your result slip.</p>
      <div className="mt-4 flex flex-wrap gap-3"><Link href="/signup" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong">Create an account when I&apos;m ready</Link><button type="button" onClick={onEdit} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:border-accent hover:text-accent">Edit my starting point</button></div>
    </section>
  </section>;
}
