"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  addApplicantQualification,
  confirmExtractionFinding,
  correctApplicantQualification,
  rejectExtractionFinding,
  removeApplicantQualification,
  updateApplicantQualificationYears,
} from "@/lib/skillsgap/actions";
import type { ApplicantExtractionFindingView, ApplicantQualificationView } from "@/lib/skillsgap/queries";
import type { Tables } from "@/lib/supabase/database.types";

type Props = {
  applicantId: string;
  initialFindings: ApplicantExtractionFindingView[];
  initialQualifications: ApplicantQualificationView[];
  availableQualifications: Tables<"qualifications">[];
  unmappedTerms: string[];
};

export function QualificationReview({ applicantId, initialFindings, initialQualifications, availableQualifications, unmappedTerms }: Props) {
  const router = useRouter();
  const [findings, setFindings] = useState(initialFindings);
  const [qualifications, setQualifications] = useState(initialQualifications);
  const [years, setYears] = useState<Record<string, string>>(() => Object.fromEntries(initialQualifications.map((item) => [item.id, item.years_experience?.toString() ?? ""])));
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [findingChoices, setFindingChoices] = useState<Record<string, string>>(() => Object.fromEntries(initialFindings.map((finding) => [finding.id, ""])));
  const [selectedQualification, setSelectedQualification] = useState(availableQualifications[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);

  async function confirmFinding(finding: ApplicantExtractionFindingView, qualificationId: string) {
    if (!qualificationId) return setMessage("Choose a skill first.");
    const result = await confirmExtractionFinding(finding.id, qualificationId);
    if (result.error) return setMessage(result.error);
    setFindings((current) => current.filter((item) => item.id !== finding.id));
    setMessage("Skill confirmed. Your role matches are being recalculated.");
    router.refresh();
  }

  async function rejectFinding(finding: ApplicantExtractionFindingView) {
    const result = await rejectExtractionFinding(finding.id);
    if (result.error) return setMessage(result.error);
    setFindings((current) => current.filter((item) => item.id !== finding.id));
    setMessage("Suggestion dismissed. It will not affect your role matches.");
    router.refresh();
  }

  async function saveYears(item: ApplicantQualificationView) {
    const value = years[item.id] ?? "";
    const result = await updateApplicantQualificationYears(item.qualification_id, value);
    if (result.error) return setMessage(result.error);
    setQualifications((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, years_experience: value.trim() ? Number(value) : null, source: "applicant_confirmed", review_status: "confirmed" } : candidate));
    setMessage("Experience updated. This strength can now improve your role matches.");
  }

  async function correct(item: ApplicantQualificationView) {
    const corrected = availableQualifications.find((qualification) => qualification.id === corrections[item.id]);
    if (!corrected) return setMessage("Choose the correct transferable skill.");
    const result = await correctApplicantQualification(item.qualification_id, corrected.id);
    if (result.error) return setMessage(result.error);
    setQualifications((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, qualification_id: corrected.id, qualificationName: corrected.name, source: "applicant_confirmed", review_status: "confirmed" } : candidate));
    setMessage("Skill corrected. Your role matches are being recalculated.");
  }

  async function add() {
    const item = availableQualifications.find((qualification) => qualification.id === selectedQualification);
    if (!item) return;
    const result = await addApplicantQualification(item.id);
    if (result.error) return setMessage(result.error);
    const id = crypto.randomUUID();
    setQualifications((current) => [...current, {
      id, applicant_id: applicantId, qualification_id: item.id, qualificationName: item.name, resume_id: null,
      years_experience: null, source: "applicant_confirmed", review_status: "confirmed", original_term: null,
      evidence: null, evidence_page: null, evidence_method: null, confidence: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }]);
    setYears((current) => ({ ...current, [id]: "" }));
    setMessage("Skill added. Your role matches are being recalculated.");
  }

  async function remove(item: ApplicantQualificationView) {
    const result = await removeApplicantQualification(item.qualification_id);
    if (result.error) return setMessage(result.error);
    setQualifications((current) => current.filter((candidate) => candidate.id !== item.id));
    setMessage("Skill removed. It will not affect your role matches.");
  }

  const knownIds = new Set(qualifications.map((item) => item.qualification_id));
  return (
    <section className="rounded-lg border border-border bg-surface p-5" aria-labelledby="qualification-review-heading">
      <h2 id="qualification-review-heading" className="text-xl font-semibold tracking-tight text-foreground">Skills from your CV</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Review what we found before it affects your matches. Only skills you confirm are added to your profile.</p>

      {findings.length > 0 ? <section className="mt-5 space-y-4" aria-labelledby="pending-findings-heading">
        <div><h3 id="pending-findings-heading" className="text-sm font-semibold text-foreground">Review CV suggestions</h3><p className="mt-1 text-sm leading-6 text-muted">Choose the skill that best describes your experience, or dismiss it if it does not apply.</p></div>
        {findings.map((finding) => <PendingFindingCard key={finding.id} finding={finding} availableQualifications={availableQualifications} selectedQualificationId={findingChoices[finding.id] ?? ""} onSelect={(qualificationId) => setFindingChoices((current) => ({ ...current, [finding.id]: qualificationId }))} onConfirm={(qualificationId) => { void confirmFinding(finding, qualificationId); }} onReject={() => { void rejectFinding(finding); }} />)}
      </section> : null}

      {qualifications.length > 0 ? <section className="mt-6" aria-labelledby="confirmed-strengths-heading"><h3 id="confirmed-strengths-heading" className="text-sm font-semibold text-foreground">Confirmed strengths</h3><ul className="mt-3 space-y-4" role="list">{qualifications.map((item) => <ConfirmedQualificationCard key={item.id} item={item} years={years[item.id] ?? ""} correction={corrections[item.id] ?? ""} availableQualifications={availableQualifications} onYearsChange={(value) => setYears((current) => ({ ...current, [item.id]: value }))} onCorrectionChange={(value) => setCorrections((current) => ({ ...current, [item.id]: value }))} onSaveYears={() => { void saveYears(item); }} onCorrect={() => { void correct(item); }} onRemove={() => { void remove(item); }} />)}</ul></section> : <p className="mt-3 rounded-lg border border-dashed border-border p-4 text-sm text-muted">No confirmed strengths yet. Upload a CV, review its suggestions, or add one below.</p>}

      {unmappedTerms.length > 0 ? <div className="mt-3 rounded-lg border border-border bg-surface-muted p-4"><h3 className="text-sm font-semibold text-foreground">Kept private for your review</h3><p className="mt-1 text-sm leading-6 text-muted">These CV terms don&apos;t affect matches. Add a matching skill below if one applies.</p><ul className="mt-2 flex flex-wrap gap-2" role="list">{unmappedTerms.map((term) => <li key={term} className="border border-amber-200 bg-white px-2.5 py-1 text-xs text-foreground">{term}</li>)}</ul></div> : null}

      <div className="mt-6 border-t border-border pt-5">
        <h3 className="text-sm font-semibold text-foreground">Add another skill</h3>
        <p className="mt-1 text-sm leading-6 text-muted">Add a skill we did not find in your CV.</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-xs font-semibold text-muted" htmlFor="add-qualification">
            Choose a skill
            <select id="add-qualification" value={selectedQualification} onChange={(event) => setSelectedQualification(event.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal">
              <option value="" disabled>Select a skill</option>
              {availableQualifications.filter((item) => !knownIds.has(item.id)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <button type="button" disabled={!selectedQualification} onClick={() => { void add(); }} className="inline-flex min-h-11 items-center justify-center rounded-md border border-accent px-4 text-sm font-semibold text-accent hover:bg-surface-muted disabled:opacity-50">Add skill</button>
        </div>
      </div>
      {message ? <p className="mt-3 text-sm text-muted" role="status">{message}</p> : null}
    </section>
  );
}

function PendingFindingCard({ finding, availableQualifications, selectedQualificationId, onSelect, onConfirm, onReject }: { finding: ApplicantExtractionFindingView; availableQualifications: Tables<"qualifications">[]; selectedQualificationId: string; onSelect: (qualificationId: string) => void; onConfirm: (qualificationId: string) => void; onReject: () => void }) {
  const selectedCandidate = finding.candidates.find((candidate) => candidate.qualification_id === selectedQualificationId);
  const selectedQualificationName = selectedCandidate?.qualificationName
    ?? availableQualifications.find((qualification) => qualification.id === selectedQualificationId)?.name;
  const alternativeQualifications = availableQualifications.filter((qualification) => !finding.candidates.some((candidate) => candidate.qualification_id === qualification.id));

  return (
    <article className="rounded-lg border border-border bg-surface p-5">
      <div>
        <p className="text-xs font-semibold text-muted">We found this in your CV</p>
        <h4 className="mt-1 text-lg font-semibold text-foreground">{finding.original_term}</h4>
      </div>

      <div className="mt-4 rounded-md bg-surface-muted p-3">
        <p className="text-xs font-semibold text-muted">Evidence from page {finding.evidence_page}</p>
        <p className="mt-1 text-sm leading-6 text-foreground">“{finding.evidence}”</p>
      </div>

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
          <select id={`alternative-${finding.id}`} value={alternativeQualifications.some((qualification) => qualification.id === selectedQualificationId) ? selectedQualificationId : ""} onChange={(event) => onSelect(event.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal">
            <option value="">Select a skill</option>
            {alternativeQualifications.map((qualification) => <option key={qualification.id} value={qualification.id}>{qualification.name}</option>)}
          </select>
        </label>
      </details>

      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={onReject} className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold text-muted hover:border-danger hover:text-danger">This does not apply</button>
        <button type="button" disabled={!selectedQualificationId} onClick={() => onConfirm(selectedQualificationId)} className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50">
          {selectedQualificationName ? `Confirm ${selectedQualificationName}` : "Choose a skill to continue"}
        </button>
      </div>
    </article>
  );
}

function ConfirmedQualificationCard({ item, years, correction, availableQualifications, onYearsChange, onCorrectionChange, onSaveYears, onCorrect, onRemove }: { item: ApplicantQualificationView; years: string; correction: string; availableQualifications: Tables<"qualifications">[]; onYearsChange: (value: string) => void; onCorrectionChange: (value: string) => void; onSaveYears: () => void; onCorrect: () => void; onRemove: () => void }) {
  return <li className="border border-border bg-surface-muted/40 p-4"><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Found in your CV</p><p className="mt-1 font-semibold text-foreground">{item.original_term ?? (item.source === "applicant_confirmed" ? "Added by you" : item.qualificationName)}</p></div><span className="hidden text-xl text-accent sm:block" aria-hidden="true">→</span><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">Confirmed oil-and-gas translation</p><p className="mt-1 font-semibold text-foreground">{item.qualificationName}</p></div></div>{item.evidence ? <p className="mt-3 border-l-2 border-border pl-3 text-sm leading-6 text-muted">“{item.evidence}”{item.evidence_page ? ` · Page ${item.evidence_page}, ${evidenceMethodLabel(item.evidence_method)}` : ""}</p> : null}<div className="mt-4 flex flex-wrap items-center gap-3"><span className="text-sm font-semibold text-emerald-800">Confirmed by you ✓</span><button type="button" onClick={onRemove} className="min-h-10 text-sm font-semibold text-danger hover:underline">Remove qualification</button></div><div className="mt-4 grid gap-3 border-t border-border pt-4 md:grid-cols-2"><div className="flex items-end gap-2"><label className="flex-1 text-xs font-semibold text-muted">Years of experience<input type="number" min={0} max={60} step="0.1" value={years} onChange={(event) => onYearsChange(event.target.value)} placeholder="Not specified" className="mt-1 min-h-10 w-full border border-border bg-surface px-3 text-sm font-normal" /></label><button type="button" onClick={onSaveYears} className="min-h-10 border border-border px-3 text-sm font-semibold text-muted hover:border-accent hover:text-accent">Save</button></div><div className="flex items-end gap-2"><label className="flex-1 text-xs font-semibold text-muted">Choose a different translation<select value={correction} onChange={(event) => onCorrectionChange(event.target.value)} className="mt-1 min-h-10 w-full border border-border bg-surface px-3 text-sm font-normal"><option value="">Select a skill</option>{availableQualifications.filter((qualification) => qualification.id !== item.qualification_id).map((qualification) => <option key={qualification.id} value={qualification.id}>{qualification.name}</option>)}</select></label><button type="button" disabled={!correction} onClick={onCorrect} className="min-h-10 border border-border px-3 text-sm font-semibold text-muted hover:border-accent hover:text-accent disabled:opacity-50">Correct</button></div></div></li>;
}

function formatCategory(category: Tables<"qualifications">["category"]): string {
  return category.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function evidenceMethodLabel(method: Tables<"applicant_qualifications">["evidence_method"]): string {
  if (method === "ocr") return "OCR";
  if (method === "vision") return "visual review";
  return "CV text";
}
