"use client";

import { useEffect, useState } from "react";

import { SavePathwayControl } from "@/components/i-want-to-become/save-pathway-control";
import { TrainingProvidersLink } from "@/components/shareable/training-providers-link";
import { supportingSubjects, type CareerPathway, type CsecResult } from "@/lib/i-want-to-become/catalog";
import type { PathwaySaveViewer } from "@/lib/i-want-to-become/pathway-plan";

type GuidedPathwayPlanProps = {
  pathway: CareerPathway;
  interests: string;
  selectedInterests: string[];
  results: CsecResult[];
  viewer: PathwaySaveViewer;
  onEdit: () => void;
};

type CareerRequirement = CareerPathway["requirements"][number];

const providerLinks = [
  ["Government Technical Institute", "https://www.education.gov.gy/en/index.php/moe-contacts/36-tertiary-institutions/253-government-technical-institute"],
  ["Board of Industrial Training", "https://srms.bit.gov.gy/"],
  ["3t Global Guyana", "https://www.3tglobal.com/about/our-locations/guyana/"],
] as const;

function RequirementCard({ requirement, position, planned, onToggle }: { requirement: CareerRequirement; position: number; planned: boolean; onToggle: () => void }) {
  return <li className={`rounded-lg border p-4 transition-colors ${planned ? "border-accent/50 bg-teal-50/30" : "border-border"}`}><div className="flex gap-3"><span className={`grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold ${planned ? "bg-accent text-white" : "bg-surface-muted text-accent"}`} aria-hidden="true">{planned ? "✓" : position}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold text-foreground">{requirement.name}</h4>{requirement.mandatory ? <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-accent">Required for this role</span> : null}</div><p className="mt-1 text-sm leading-6 text-muted">{requirement.detail}</p>{requirement.minimumYears ? <p className="mt-2 text-sm font-medium text-foreground">Plan for at least {requirement.minimumYears} year{requirement.minimumYears === 1 ? "" : "s"} of relevant experience.</p> : null}{requirement.training ? <p className="mt-2 text-sm font-medium text-accent">Training to explore: {requirement.training}</p> : <p className="mt-2 text-sm text-muted">Ask a recognised provider about the current route before enrolling.</p>}<TrainingProvidersLink qualification={requirement.name} /><button type="button" aria-pressed={planned} onClick={onToggle} className={`mt-4 inline-flex min-h-10 items-center rounded-md border px-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${planned ? "border-accent bg-white text-accent" : "border-border bg-surface text-foreground hover:border-accent hover:text-accent"}`}>{planned ? "On my list" : "Add to my list"}</button></div></div></li>;
}

export function GuidedPathwayPlan({ pathway, interests, selectedInterests, results, viewer, onEdit }: GuidedPathwayPlanProps) {
  const subjects = supportingSubjects(pathway, results);
  const storageKey = `skillsgap:i-want-to-become:planned-requirements:${pathway.id}`;
  const [plannedRequirementNames, setPlannedRequirementNames] = useState<Set<string>>(() => new Set());
  const [storageReady, setStorageReady] = useState(false);
  const plannedCount = pathway.requirements.filter((requirement) => plannedRequirementNames.has(requirement.name)).length;

  useEffect(() => {
    const stored = window.sessionStorage.getItem(storageKey);
    let restored = new Set<string>();
    if (stored) {
      try {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) restored = new Set(parsed.filter((item): item is string => typeof item === "string"));
      } catch {
        window.sessionStorage.removeItem(storageKey);
      }
    }
    queueMicrotask(() => {
      setPlannedRequirementNames(restored);
      setStorageReady(true);
    });
  }, [storageKey]);

  useEffect(() => {
    if (!storageReady) return;
    if (plannedRequirementNames.size > 0) window.sessionStorage.setItem(storageKey, JSON.stringify([...plannedRequirementNames]));
    else window.sessionStorage.removeItem(storageKey);
  }, [plannedRequirementNames, storageKey, storageReady]);

  function toggleRequirement(name: string) {
    setPlannedRequirementNames((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return <section className="rounded-lg border border-border bg-surface p-5 sm:p-8" aria-labelledby="plan-title"><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Your starting plan</p><h2 id="plan-title" className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">A route toward {pathway.title}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">This is a career-planning guide, not a job application. Your CSEC/CXC results can help you prepare; they are not professional qualifications or a job-match score.</p>

    <section className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-3" aria-label="Plan snapshot"><div className="bg-surface-muted p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Foundation</p><p className="mt-2 text-xl font-semibold text-foreground">{subjects.length}</p><p className="text-sm text-muted">subjects to explore</p></div><div className="bg-surface-muted p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Pathway</p><p className="mt-2 text-xl font-semibold text-foreground">{pathway.requirements.length}</p><p className="text-sm text-muted">skills and requirements</p></div><div className="bg-surface-muted p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Your list</p><p className="mt-2 text-xl font-semibold text-accent">{plannedCount}/{pathway.requirements.length}</p><p className="text-sm text-muted">steps marked to explore</p></div></section>

    <section className="mt-8 border-l-4 border-accent bg-surface-muted p-5" aria-labelledby="subjects-title"><p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">A useful foundation</p><h3 id="subjects-title" className="mt-2 text-xl font-semibold tracking-tight">Subjects that can support this direction</h3><ul className="mt-4 grid gap-2 sm:grid-cols-2">{subjects.map(({ subject, confirmed }) => <li key={subject} className="flex items-center gap-2 text-sm"><span aria-hidden="true" className={`grid size-5 place-items-center rounded-full text-xs font-bold ${confirmed ? "bg-accent text-white" : "border border-border text-muted"}`}>{confirmed ? "✓" : "→"}</span><span className="font-medium text-foreground">{subject}</span><span className="text-muted">{confirmed ? "listed by you" : "worth exploring"}</span></li>)}</ul>{results.length === 0 ? <p className="mt-4 text-sm text-muted">Add your results whenever you have them. Your plan is still a useful place to begin.</p> : null}</section>

    <section className="mt-8" aria-labelledby="steps-title"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-muted">Practical next steps</p><h3 id="steps-title" className="mt-2 text-xl font-semibold tracking-tight">Build the requirements one at a time</h3></div><p className="text-sm font-semibold text-accent">{plannedCount}/{pathway.requirements.length} on your list</p></div><div className="mt-5" role="progressbar" aria-label={`${plannedCount} of ${pathway.requirements.length} pathway requirements on your list`} aria-valuemin={0} aria-valuemax={pathway.requirements.length} aria-valuenow={plannedCount}><div className="h-2 overflow-hidden rounded-full bg-surface-muted"><div className="h-full bg-accent transition-[width]" style={{ width: `${pathway.requirements.length > 0 ? (plannedCount / pathway.requirements.length) * 100 : 0}%` }} /></div></div><ol className="mt-5 space-y-3">{pathway.requirements.map((requirement, index) => <RequirementCard key={requirement.name} requirement={requirement} position={index + 1} planned={plannedRequirementNames.has(requirement.name)} onToggle={() => toggleRequirement(requirement.name)} />)}</ol></section>

    <section className="mt-8" aria-labelledby="provider-links-title"><p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Official places to continue</p><h3 id="provider-links-title" className="mt-2 text-xl font-semibold tracking-tight">Confirm the current route directly</h3><div className="mt-4 grid gap-3 sm:grid-cols-3">{providerLinks.map(([name, url]) => <a key={name} href={url} target="_blank" rel="noreferrer" className="border border-border bg-surface p-4 text-sm font-semibold text-foreground hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{name} <span aria-hidden="true">↗</span></a>)}</div><p className="mt-4 text-sm leading-6 text-muted">Training availability and entry requirements can change. Ask the provider about intake, cost, duration, and any medical or safety requirements before spending money.</p></section>

    <section className="mt-8 rounded-lg border border-border bg-surface-muted p-5" aria-labelledby="account-title"><h3 id="account-title" className="text-lg font-semibold tracking-tight">Keep this career route</h3><p className="mt-2 max-w-xl text-sm leading-6 text-muted">Save this planning draft privately. Your interests and CSEC/CXC entries stay unverified and do not become qualifications.</p><div className="mt-4 flex flex-wrap gap-3"><SavePathwayControl viewer={viewer} plan={{ pathwayKind: "guided", pathwayKey: pathway.id, interests, selectedInterests, results, plannedRequirementNames: [...plannedRequirementNames], completedActionIds: [] }} /><button type="button" onClick={onEdit} className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:border-accent hover:text-accent">Edit my starting point</button></div></section>
  </section>;
}
