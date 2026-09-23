"use client";

import { useLayoutEffect, useRef, type FormEvent } from "react";

import { CareerPathwayPicker } from "@/components/i-want-to-become/career-pathway-picker";
import { CareerResultsEditor } from "@/components/i-want-to-become/career-results-editor";
import type { ExplorerStep, PhotoState } from "@/components/i-want-to-become/explorer-types";
import type { CsecResult } from "@/lib/i-want-to-become/catalog";
import type { PublicOccupation } from "@/lib/i-want-to-become/occupations";

type CareerExplorerFormProps = {
  step: ExplorerStep;
  careerId: string;
  occupations: PublicOccupation[];
  interests: string;
  selectedInterests: string[];
  results: CsecResult[];
  photoName: string | null;
  photoPreview: string | null;
  photoState: PhotoState;
  photoError: string | null;
  resultsReviewed: boolean;
  planLoading: boolean;
  onCareerChange: (careerId: string) => void;
  onInterestsChange: (interests: string) => void;
  onToggleInterest: (interest: string) => void;
  onFileSelected: (file: File) => void;
  onUpdateResult: (index: number, field: keyof CsecResult, value: string) => void;
  onRemoveResult: (index: number) => void;
  onAddResult: () => void;
  onResultsReviewedChange: (reviewed: boolean) => void;
  onStepChange: (step: ExplorerStep) => void;
  onShowResults: () => void;
};

const interestOptions = ["Fixing things", "Safety", "Numbers", "Science", "Working outdoors", "Organising", "Working with people"];

function InterestChoice({ interest, selected, onToggle }: { interest: string; selected: boolean; onToggle: () => void }) {
  return <label className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm font-semibold transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent ${selected ? "border-accent bg-accent text-white" : "border-border bg-surface text-foreground hover:border-accent hover:text-accent"}`}><input type="checkbox" checked={selected} onChange={onToggle} className="sr-only" />{selected ? "✓ " : ""}{interest}</label>;
}

export function CareerExplorerForm({ step, careerId, occupations, interests, selectedInterests, results, photoName, photoPreview, photoState, photoError, resultsReviewed, planLoading, onCareerChange, onInterestsChange, onToggleInterest, onFileSelected, onUpdateResult, onRemoveResult, onAddResult, onResultsReviewedChange, onStepChange, onShowResults }: CareerExplorerFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousStepRef = useRef(step);
  const canContinue = step !== 1 || careerId.length > 0;
  const hasResultEntries = results.some((result) => result.subject.trim().length > 0 || result.grade.trim().length > 0);

  useLayoutEffect(() => {
    if (previousStepRef.current === step) return;
    previousStepRef.current = step;
    formRef.current?.scrollIntoView({ behavior: "instant", block: "start" });
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 3) {
      if ((!hasResultEntries || resultsReviewed) && !planLoading) onShowResults();
      return;
    }
    if (canContinue) onStepChange(step === 1 ? 2 : 3);
  }

  const stepCopy = step === 1
    ? { eyebrow: "Step 1 of 3", title: "Choose a direction.", description: "Start with work you can picture yourself learning. You can change it before building your route." }
    : step === 2
      ? { eyebrow: "Step 2 of 3", title: "What sounds like you?", description: "Pick a few interests, or write a note. This is reflection, not a test." }
      : { eyebrow: "Step 3 of 3", title: "Share your starting point.", description: "Add results to guide preparation, or build a route without them." };

  return (
    <form ref={formRef} id="career-explorer-form" onSubmit={handleSubmit} className="scroll-mt-4 rounded-lg border border-border bg-surface p-5 sm:scroll-mt-6 sm:p-8" aria-labelledby="explorer-step-title">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{stepCopy.eyebrow}</p><h2 ref={headingRef} id="explorer-step-title" tabIndex={-1} className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{stepCopy.title}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{stepCopy.description}</p></div><span className="inline-flex w-fit items-center rounded-full bg-surface-muted px-3 py-1.5 text-xs font-bold text-accent">No account needed</span></div>

      <div className="mt-7">
        {step === 1 ? <fieldset><legend className="text-base font-semibold text-foreground">What would you like to become?</legend><p className="mt-1 text-sm text-muted">Browse the guided starter routes or the wider petroleum work catalogue.</p><CareerPathwayPicker occupations={occupations} selectedId={careerId} onSelect={onCareerChange} /></fieldset> : null}

        {step === 2 ? <fieldset><legend className="text-base font-semibold text-foreground">What sounds like you?</legend><p className="mt-1 text-sm text-muted">Select any that feel true. There are no wrong answers.</p><div className="mt-4 flex flex-wrap gap-2">{interestOptions.map((interest) => <InterestChoice key={interest} interest={interest} selected={selectedInterests.includes(interest)} onToggle={() => onToggleInterest(interest)} />)}</div><label htmlFor="interests" className="mt-6 block text-sm font-semibold text-foreground">Interests or strengths <span className="font-normal text-muted">(optional)</span></label><textarea id="interests" value={interests} onChange={(event) => onInterestsChange(event.target.value)} rows={5} maxLength={600} className="mt-2 w-full border border-border bg-white p-3 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted focus:border-accent" placeholder="For example: I enjoy fixing things, science, safety, organising stock, or working outdoors." /><div className="mt-2 flex justify-between gap-3 text-xs text-muted"><span>This helps you reflect on your direction. It does not change eligibility.</span><span>{interests.length}/600</span></div></fieldset> : null}

        {step === 3 ? <CareerResultsEditor results={results} photoName={photoName} photoPreview={photoPreview} photoState={photoState} photoError={photoError} resultsReviewed={resultsReviewed} onFileSelected={onFileSelected} onUpdateResult={onUpdateResult} onRemoveResult={onRemoveResult} onAddResult={onAddResult} onResultsReviewedChange={onResultsReviewedChange} /> : null}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={() => onStepChange(step === 1 ? 1 : step === 2 ? 1 : 2)} disabled={step === 1} className="inline-flex min-h-11 w-fit items-center justify-center px-1 text-sm font-semibold text-muted underline-offset-4 transition hover:text-accent hover:underline disabled:cursor-not-allowed disabled:opacity-0">← Back</button><div className="flex flex-col items-stretch gap-3 sm:items-end">{step === 2 ? <button type="button" onClick={() => onStepChange(3)} className="min-h-11 px-1 text-sm font-semibold text-muted underline-offset-4 hover:text-accent hover:underline">Skip strengths</button> : null}{step === 3 && hasResultEntries && !resultsReviewed ? <p id="review-required" className="text-sm text-amber-800" role="alert">Review the results above before building your route.</p> : null}{step < 3 ? <button type="submit" disabled={!canContinue} className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50">Continue <span aria-hidden="true" className="ml-2">→</span></button> : <button type="submit" disabled={(hasResultEntries && !resultsReviewed) || planLoading} aria-describedby={hasResultEntries && !resultsReviewed ? "review-required" : undefined} className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50">{planLoading ? "Building your route…" : hasResultEntries ? "Build my pathway" : "Build without results"} <span aria-hidden="true" className="ml-2">→</span></button>}</div></div>
    </form>
  );
}
