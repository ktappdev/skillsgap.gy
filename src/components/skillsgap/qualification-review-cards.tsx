import { Tooltip } from "@/components/ui/tooltip";
import type { ApplicantExtractionFindingView, ApplicantQualificationView } from "@/lib/skillsgap/queries";
import type { Tables } from "@/lib/supabase/database.types";

/** Which review action a card is currently running, so only that control goes busy. */
export type QualificationAction = "dismiss" | "years" | "correct" | "remove";

export function PendingFindingCard({ finding, availableQualifications, selectedQualificationId, pending, onSelect, onReject }: { finding: ApplicantExtractionFindingView; availableQualifications: Tables<"qualifications">[]; selectedQualificationId: string; pending: QualificationAction | null; onSelect: (qualificationId: string) => void; onReject: () => void }) {
  const isDismissing = pending === "dismiss";
  const alternativeQualifications = availableQualifications.filter((qualification) => !finding.candidates.some((candidate) => candidate.qualification_id === qualification.id));

  return (
    <article className="rounded-lg border border-border bg-surface p-5">
      <div>
        <p className="text-xs font-semibold text-muted">{finding.evidence_method === "text" ? "You described this" : "We found this in your CV"}</p>
        <h4 className="mt-1 text-lg font-semibold text-foreground"><Tooltip label="This is a suggestion, not a skill on your profile yet. It affects nothing until you confirm it."><span tabIndex={0}>{finding.original_term}</span></Tooltip></h4>
      </div>

      <details className="mt-3 text-sm"><summary className="cursor-pointer py-2 text-muted">{finding.evidence_method === "text" ? "See what you wrote" : `See CV evidence · Page ${finding.evidence_page}`}</summary>
        <p className="mt-1 text-sm leading-6 text-foreground">“{finding.evidence}”</p>
      </details>

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold text-foreground">Which skill best matches your experience?</legend>
        <div className="mt-3 space-y-2">
          {finding.candidates.map((candidate) => {
            const isSelected = selectedQualificationId === candidate.qualification_id;
            return (
              <label key={candidate.qualification_id} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-md border px-3 py-3 transition-colors ${isSelected ? "border-accent bg-surface-muted" : "border-border bg-surface hover:border-accent"}`}>
                <input type="radio" name={`finding-${finding.id}`} value={candidate.qualification_id} checked={isSelected} onChange={() => onSelect(candidate.qualification_id)} className="size-4 shrink-0 accent-accent" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-foreground">{candidate.qualificationName}</span>
                  <span className="mt-1 block text-sm text-muted">{formatCategory(candidate.category)}</span>
                </span>
                {isSelected ? <span className="text-xs font-semibold text-accent">Selected</span> : null}
              </label>
            );
          })}
        </div>
      </fieldset>

      <details className="mt-4 border-t border-border pt-4">
        <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-accent">None of these? Choose another skill</summary>
        <label className="mt-2 block text-xs font-semibold text-muted" htmlFor={`alternative-${finding.id}`}>
          Choose an active skill
          <select id={`alternative-${finding.id}`} value={alternativeQualifications.some((qualification) => qualification.id === selectedQualificationId) ? selectedQualificationId : ""} onChange={(event) => onSelect(event.target.value)} className="mt-1 min-h-11 w-full min-w-0 rounded-md border border-border bg-surface px-3 text-base font-normal sm:text-sm">
            <option value="">Select a skill</option>
            {alternativeQualifications.map((qualification) => <option key={qualification.id} value={qualification.id}>{qualification.name}</option>)}
          </select>
        </label>
      </details>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button type="button" disabled={isDismissing} aria-busy={isDismissing} onClick={onReject} className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold text-muted transition-colors hover:border-danger hover:text-danger disabled:cursor-wait disabled:opacity-60">{isDismissing ? "Dismissing…" : "This does not apply"}</button>
        {selectedQualificationId ? <span className="text-sm font-semibold text-accent">Ready to confirm ✓</span> : null}
      </div>
    </article>
  );
}

export function ConfirmedQualificationCard({ item, years, correction, availableQualifications, pending, onYearsChange, onCorrectionChange, onSaveYears, onCorrect, onRemove }: { item: ApplicantQualificationView; years: string; correction: string; availableQualifications: Tables<"qualifications">[]; pending: QualificationAction | null; onYearsChange: (value: string) => void; onCorrectionChange: (value: string) => void; onSaveYears: () => void; onCorrect: () => void; onRemove: () => void }) {
  const isRemoving = pending === "remove";
  const isSavingYears = pending === "years";
  const isCorrecting = pending === "correct";

  return (
    <li className="border border-border bg-surface-muted/40 p-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
        <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{item.evidence_method === "text" ? "You described this" : "Found in your CV"}</p><p className="mt-1 font-semibold text-foreground">{item.original_term ?? (item.source === "applicant_confirmed" ? "Added by you" : item.qualificationName)}</p></div>
        <span className="hidden text-xl text-accent sm:block" aria-hidden="true">→</span>
        <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">Confirmed skill</p><p className="mt-1 font-semibold text-foreground">{item.qualificationName}</p></div>
      </div>
      {item.evidence ? <p className="mt-3 border-l-2 border-border pl-3 text-sm leading-6 text-muted">“{item.evidence}” · {item.evidence_method === "text" || !item.evidence_page ? evidenceMethodLabel(item.evidence_method) : `Page ${item.evidence_page}, ${evidenceMethodLabel(item.evidence_method)}`}</p> : null}
      <div className="mt-4 flex flex-wrap items-center gap-3"><Tooltip label="Confirmed skills are the only ones that count toward your matches. Removing one removes it from your score."><span tabIndex={0} className="text-sm font-semibold text-emerald-800">Confirmed by you ✓</span></Tooltip><button type="button" disabled={isRemoving} aria-busy={isRemoving} onClick={onRemove} className="min-h-11 rounded-md px-1 text-sm font-semibold text-danger transition-colors hover:bg-red-50 hover:underline disabled:cursor-wait disabled:opacity-60">{isRemoving ? "Removing…" : "Remove qualification"}</button></div>
      <div className="mt-4 grid gap-4 border-t border-border pt-4 md:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1 text-xs font-semibold text-muted">Years of experience<input type="number" min={0} max={60} step="0.1" value={years} onChange={(event) => onYearsChange(event.target.value)} placeholder="Not specified" className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-base font-normal outline-none transition-colors focus:border-accent sm:text-sm" /></label>
          <button type="button" disabled={isSavingYears} aria-busy={isSavingYears} onClick={onSaveYears} className="min-h-11 w-full rounded-md border border-border px-3 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-60 sm:w-auto">{isSavingYears ? "Saving…" : "Save years"}</button>
        </div>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1 text-xs font-semibold text-muted">Choose a different skill<select value={correction} onChange={(event) => onCorrectionChange(event.target.value)} className="mt-1 min-h-11 w-full min-w-0 rounded-md border border-border bg-surface px-3 text-base font-normal outline-none transition-colors focus:border-accent sm:text-sm"><option value="">Select a skill</option>{availableQualifications.filter((qualification) => qualification.id !== item.qualification_id).map((qualification) => <option key={qualification.id} value={qualification.id}>{qualification.name}</option>)}</select></label>
          <button type="button" disabled={!correction || isCorrecting} aria-busy={isCorrecting} onClick={onCorrect} className="min-h-11 w-full rounded-md border border-border px-3 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">{isCorrecting ? "Updating…" : "Use skill"}</button>
        </div>
      </div>
    </li>
  );
}

function formatCategory(category: Tables<"qualifications">["category"]): string {
  return category.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function evidenceMethodLabel(method: Tables<"applicant_qualifications">["evidence_method"]): string {
  if (method === "text") return "your own words";
  if (method === "ocr") return "OCR";
  if (method === "vision") return "visual review";
  return "CV text";
}
