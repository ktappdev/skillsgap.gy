"use client";

import { useLayoutEffect, useRef, type FormEvent } from "react";

import { CareerPathwayPicker } from "@/components/i-want-to-become/career-pathway-picker";
import { CareerInterestPicker } from "@/components/i-want-to-become/career-interest-picker";
import { CareerSuggestions } from "@/components/i-want-to-become/career-suggestions";
import { CareerResultsEditor } from "@/components/i-want-to-become/career-results-editor";
import type { ExplorerStep, PhotoState } from "@/components/i-want-to-become/explorer-types";
import type { CsecResult } from "@/lib/i-want-to-become/catalog";
import type { PublicOccupation } from "@/lib/i-want-to-become/occupations";
import type { CareerInterest, InterestSuggestion, RelatedPosition } from "@/lib/i-want-to-become/interests";

type CareerExplorerFormProps = {
  step: ExplorerStep;
  careerId: string;
  occupations: PublicOccupation[];
  positions: RelatedPosition[];
  suggestions: InterestSuggestion[];
  interestCatalogue: CareerInterest[];
  browsingAll: boolean;
  selectedInterests: string[];
  results: CsecResult[];
  photoName: string | null;
  photoPreview: string | null;
  photoState: PhotoState;
  photoError: string | null;
  resultsReviewed: boolean;
  planLoading: boolean;
  onCareerChange: (careerId: string) => void;
  onSuggestedCareerChange: (careerId: string) => void;
  onBrowseAll: () => void;
  onBrowseSuggestions: () => void;
  onToggleInterest: (interest: string) => void;
  onFileSelected: (file: File) => void;
  onUpdateResult: (index: number, field: keyof CsecResult, value: string) => void;
  onRemoveResult: (index: number) => void;
  onAddResult: () => void;
  onResultsReviewedChange: (reviewed: boolean) => void;
  onStepChange: (step: ExplorerStep) => void;
  onShowResults: () => void;
};

export function CareerExplorerForm({ step, careerId, occupations, positions, suggestions, interestCatalogue, browsingAll, selectedInterests, results, photoName, photoPreview, photoState, photoError, resultsReviewed, planLoading, onCareerChange, onSuggestedCareerChange, onBrowseAll, onBrowseSuggestions, onToggleInterest, onFileSelected, onUpdateResult, onRemoveResult, onAddResult, onResultsReviewedChange, onStepChange, onShowResults }: CareerExplorerFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousStepRef = useRef(step);
  const canContinue = step === 1 ? selectedInterests.length > 0 : step === 2 ? careerId.length > 0 : true;
  const hasResultEntries = results.some((result) => result.subject.trim().length > 0 || result.grade.trim().length > 0);
  const continueLabel = step === 1
    ? selectedInterests.length > 0 ? "Suggest career paths" : "Choose an interest"
    : "Continue";

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
    ? { eyebrow: "Step 1 of 3", title: "What sounds like you?", description: "Choose up to five kinds of work for suggestions. If you prefer, leave a short private note and continue to browse every career path." }
    : step === 2
      ? { eyebrow: "Step 2 of 3", title: browsingAll ? "Browse every career path." : "Paths to explore.", description: "Your interests help suggest paths to explore. They are not a test or a job-fit score." }
      : { eyebrow: "Step 3 of 3", title: "Add CSEC/CXC results.", description: "Your results can help explain preparation for this path. They do not rank paths or count as qualifications." };

  return (
    <form ref={formRef} id="career-explorer-form" onSubmit={handleSubmit} className="scroll-mt-4 rounded-lg border border-border bg-surface p-5 sm:scroll-mt-6 sm:p-8" aria-labelledby="explorer-step-title">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{stepCopy.eyebrow}</p><h2 ref={headingRef} id="explorer-step-title" tabIndex={-1} className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{stepCopy.title}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{stepCopy.description}</p></div><span className="inline-flex w-fit items-center rounded-full bg-surface-muted px-3 py-1.5 text-xs font-bold text-accent">No account needed</span></div>

      <div className="mt-7">
        {step === 1 ? <fieldset><legend className="text-base font-semibold text-foreground">What kinds of work interest you?</legend><CareerInterestPicker interests={interestCatalogue} selectedInterests={selectedInterests} onToggle={onToggleInterest} /></fieldset> : null}

        {step === 2 ? <div>{browsingAll ? <><button type="button" onClick={onBrowseSuggestions} className="mb-3 min-h-11 text-sm font-semibold text-accent underline-offset-4 hover:underline">← Back to my suggestions</button><CareerPathwayPicker occupations={occupations} selectedId={careerId} onSelect={onCareerChange} /></> : <CareerSuggestions suggestions={suggestions} positions={positions} selectedId={careerId} onSelect={onSuggestedCareerChange} onBrowseAll={onBrowseAll} />}</div> : null}


        {step === 3 ? <CareerResultsEditor results={results} photoName={photoName} photoPreview={photoPreview} photoState={photoState} photoError={photoError} resultsReviewed={resultsReviewed} onFileSelected={onFileSelected} onUpdateResult={onUpdateResult} onRemoveResult={onRemoveResult} onAddResult={onAddResult} onResultsReviewedChange={onResultsReviewedChange} /> : null}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={() => onStepChange(step === 1 ? 1 : step === 2 ? 1 : 2)} disabled={step === 1} className="inline-flex min-h-11 w-fit items-center justify-center px-1 text-sm font-semibold text-muted underline-offset-4 transition hover:text-accent hover:underline disabled:cursor-not-allowed disabled:opacity-0">← Back</button><div className="flex flex-col items-stretch gap-3 sm:items-end">{step === 1 ? <button type="button" onClick={onBrowseAll} className="min-h-11 px-1 text-sm font-semibold text-muted underline-offset-4 hover:text-accent hover:underline">Browse all paths without suggestions</button> : null}{step === 3 && hasResultEntries && !resultsReviewed ? <p id="review-required" className="text-sm text-amber-800" role="alert">Review the results above before building your route.</p> : null}{step < 3 ? <button type="submit" disabled={!canContinue} className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50">{continueLabel} <span aria-hidden="true" className="ml-2">→</span></button> : <button type="submit" disabled={(hasResultEntries && !resultsReviewed) || planLoading} aria-describedby={hasResultEntries && !resultsReviewed ? "review-required" : undefined} className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50">{planLoading ? "Building your route…" : hasResultEntries ? "Build my pathway" : "Build without results"} <span aria-hidden="true" className="ml-2">→</span></button>}</div></div>
    </form>
  );
}
