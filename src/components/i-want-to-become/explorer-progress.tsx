"use client";

import type { ExplorerStep } from "@/components/i-want-to-become/explorer-types";

type ExplorerProgressProps = {
  activeStep: ExplorerStep;
  hasCareer: boolean;
  hasStartingPoint: boolean;
  hasPlan: boolean;
  canVisitStep: (step: ExplorerStep) => boolean;
  onStepSelect: (step: ExplorerStep) => void;
};

type ExplorerSummaryProps = {
  activeStep: ExplorerStep;
  selectedTitle: string | null;
  selectedDetail: string | null;
  selectedInterests: string[];
  resultCount: number;
  canVisitStep: (step: ExplorerStep) => boolean;
  onStepSelect: (step: ExplorerStep) => void;
};

const progressSteps: Array<{ step: ExplorerStep; label: string; caption: string }> = [
  { step: 1, label: "Direction", caption: "Choose a route" },
  { step: 2, label: "Strengths", caption: "What sounds like you" },
  { step: 3, label: "Starting point", caption: "Results or no results" },
];

export function ExplorerProgress({ activeStep, hasCareer, hasStartingPoint, hasPlan, canVisitStep, onStepSelect }: ExplorerProgressProps) {
  const completed = [hasCareer, hasStartingPoint, hasPlan];
  return (
    <nav aria-label="Pathway builder progress" className="rounded-lg border border-border bg-surface p-3 sm:p-4">
      <ol className="grid gap-2 sm:grid-cols-3 sm:gap-0">
        {progressSteps.map(({ step, label, caption }, index) => {
          const isActive = step === activeStep;
          const canVisit = canVisitStep(step);
          return <li key={step} className="relative sm:flex sm:items-center"><button type="button" onClick={() => onStepSelect(step)} disabled={!canVisit} aria-current={isActive ? "step" : undefined} className={`group flex min-h-12 w-full items-center gap-3 px-2 py-2 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-3 ${canVisit ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}><span className={`grid size-8 shrink-0 place-items-center rounded-full border text-sm font-bold ${isActive ? "border-accent bg-accent text-white" : completed[index] ? "border-accent bg-surface-muted text-accent" : "border-border bg-surface-muted text-muted"}`}>{completed[index] && !isActive ? "✓" : step}</span><span className="min-w-0"><span className={`block text-sm font-semibold ${isActive ? "text-foreground" : "text-muted"}`}>{label}</span><span className="block text-xs text-muted">{caption}</span></span></button>{index < progressSteps.length - 1 ? <span aria-hidden="true" className="hidden h-px flex-1 bg-border sm:block" /> : null}</li>;
        })}
      </ol>
    </nav>
  );
}

function SummaryRow({ label, value, step, activeStep, canVisitStep, onStepSelect }: { label: string; value: string; step: ExplorerStep; activeStep: ExplorerStep; canVisitStep: (step: ExplorerStep) => boolean; onStepSelect: (step: ExplorerStep) => void }) {
  const canVisit = canVisitStep(step);
  return <button type="button" onClick={() => onStepSelect(step)} disabled={!canVisit} className={`flex w-full items-start justify-between gap-3 border-b border-border py-3 text-left last:border-b-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${canVisit ? "hover:text-accent" : "cursor-not-allowed opacity-60"}`}><span className="text-sm text-muted">{label}</span><span className={`max-w-[10rem] text-right text-sm font-semibold ${activeStep === step ? "text-accent" : "text-foreground"}`}>{value}</span></button>;
}

export function ExplorerSummary({ activeStep, selectedTitle, selectedDetail, selectedInterests, resultCount, canVisitStep, onStepSelect }: ExplorerSummaryProps) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start" aria-label="Your pathway summary">
      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Your route so far</h2>
        <div className="mt-3 rounded-lg border border-border bg-surface-muted p-4"><p className="text-sm text-muted">Destination</p><p className="mt-2 font-semibold leading-5 text-foreground">{selectedTitle ?? "Choose a direction to begin"}</p>{selectedDetail ? <p className="mt-1 text-sm text-muted">{selectedDetail}</p> : null}</div>
        <div className="mt-3 divide-y divide-border border-y border-border"><SummaryRow label="Direction" value={selectedTitle ? "Selected" : "Not chosen"} step={1} activeStep={activeStep} canVisitStep={canVisitStep} onStepSelect={onStepSelect} /><SummaryRow label="Strengths" value={selectedInterests.length > 0 ? `${selectedInterests.length} selected` : "Optional"} step={2} activeStep={activeStep} canVisitStep={canVisitStep} onStepSelect={onStepSelect} /><SummaryRow label="CSEC/CXC" value={resultCount > 0 ? `${resultCount} result${resultCount === 1 ? "" : "s"}` : "Not added yet"} step={3} activeStep={activeStep} canVisitStep={canVisitStep} onStepSelect={onStepSelect} /></div>
      </section>
      <section className="rounded-lg border border-border bg-surface-muted p-5"><ul className="space-y-2 text-sm leading-5 text-foreground"><li className="flex gap-2"><span aria-hidden="true" className="text-accent">✓</span> A route for your role in Guyana</li><li className="flex gap-2"><span aria-hidden="true" className="text-accent">✓</span> Three next moves</li><li className="flex gap-2"><span aria-hidden="true" className="text-accent">✓</span> Official links to verify</li></ul></section>
      <p className="px-1 text-xs leading-5 text-muted">This draft stays in this tab until you close it or start over. Slip images are sent for extraction and are not included in the draft.</p>
    </aside>
  );
}
