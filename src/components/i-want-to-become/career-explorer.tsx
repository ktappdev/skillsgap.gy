"use client";

import { CareerExplorerForm } from "@/components/i-want-to-become/career-explorer-form";
import { GuidedPathwayPlan } from "@/components/i-want-to-become/guided-pathway-plan";
import { ExplorerProgress, ExplorerSummary } from "@/components/i-want-to-become/explorer-progress";
import { OccupationPathwayReport } from "@/components/i-want-to-become/occupation-pathway-report";
import { useCareerExplorer } from "@/components/i-want-to-become/use-career-explorer";
import { occupationCatalog, type PublicOccupation } from "@/lib/i-want-to-become/occupations";

type CareerExplorerProps = { initialOccupations?: PublicOccupation[] };

function PlanError({ onEdit }: { onEdit: () => void }) {
  return <section className="border border-border bg-surface p-6 shadow-sm sm:p-8" aria-labelledby="plan-error-title"><p className="text-xs font-bold uppercase tracking-[0.18em] text-danger">Pathway unavailable</p><h2 id="plan-error-title" className="mt-3 text-2xl font-semibold tracking-tight text-foreground">We could not load that route right now.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-muted">Your direction and starting point are still here. Try again in a moment or edit your starting point to choose another route.</p><button type="button" onClick={onEdit} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Back to my starting point</button></section>;
}

export function CareerExplorer({ initialOccupations = occupationCatalog }: CareerExplorerProps) {
  const explorer = useCareerExplorer(initialOccupations);
  const { careerId, interests, selectedInterests, results, photoName, photoPreview, photoState, photoError, resultsReviewed, step, showPlan, occupations, occupationPlan, planSource, planLoading, planError, draftReady, draftRestored, guidedPathway, selectedOccupation, completedResults, selectedTitle, selectedDetail, updateResult, toggleInterest, selectCareer, readSlip, showResults, editStartingPoint, resetDraft, canVisitStep, setResults, setResultsReviewed, setStep } = explorer;

  function removeResult(index: number) {
    setResults((current) => current.length > 1 ? current.filter((_, itemIndex) => itemIndex !== index) : current);
    setResultsReviewed(false);
  }

  function addResult() {
    setResults((current) => [...current, { subject: "", grade: "" }]);
    setResultsReviewed(false);
  }

  if (!draftReady) return <section className="border border-border bg-surface p-6 shadow-sm sm:p-8" aria-busy="true"><div className="h-3 w-28 animate-pulse bg-surface-muted" /><div className="mt-4 h-8 max-w-md animate-pulse bg-surface-muted" /><p className="mt-4 text-sm text-muted">Restoring your starting point…</p></section>;

  if (showPlan) {
    if (guidedPathway) return <GuidedPathwayPlan pathway={guidedPathway} results={completedResults} onEdit={editStartingPoint} />;
    if (selectedOccupation && occupationPlan) return <div>{planLoading ? <p className="mb-3 text-sm text-muted" role="status">Refreshing the verified pathway catalogue…</p> : null}<OccupationPathwayReport pathway={occupationPlan} interests={interests} selectedInterests={selectedInterests} results={completedResults} source={planSource} onEdit={editStartingPoint} /></div>;
    if (planError) return <PlanError onEdit={editStartingPoint} />;
  }

  function selectStep(targetStep: typeof step) {
    if (canVisitStep(targetStep)) setStep(targetStep);
  }

  return <div id="career-explorer" className="scroll-mt-6">
    {draftRestored ? <div className="mb-4 flex flex-col gap-3 border border-accent/30 bg-teal-50/50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-foreground">Your pathway draft is back.</p><p className="mt-1 text-sm text-muted">We kept it in this browser so you can pick up where you left off.</p></div><button type="button" onClick={resetDraft} className="w-fit text-sm font-semibold text-accent underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Start over</button></div> : null}
    <ExplorerProgress activeStep={step} hasCareer={Boolean(careerId)} hasStartingPoint={step >= 3 || showPlan} hasPlan={showPlan} canVisitStep={canVisitStep} onStepSelect={selectStep} />
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <CareerExplorerForm step={step} careerId={careerId} occupations={occupations} interests={interests} selectedInterests={selectedInterests} results={results} photoName={photoName} photoPreview={photoPreview} photoState={photoState} photoError={photoError} resultsReviewed={resultsReviewed} planLoading={planLoading} onCareerChange={selectCareer} onInterestsChange={explorer.setInterests} onToggleInterest={toggleInterest} onFileSelected={(file) => { void readSlip(file); }} onUpdateResult={updateResult} onRemoveResult={removeResult} onAddResult={addResult} onResultsReviewedChange={setResultsReviewed} onStepChange={setStep} onShowResults={() => { void showResults(); }} />
      <ExplorerSummary activeStep={step} selectedTitle={selectedTitle} selectedDetail={selectedDetail} selectedInterests={selectedInterests} resultCount={completedResults.length} canVisitStep={canVisitStep} onStepSelect={selectStep} />
    </div>
  </div>;
}
