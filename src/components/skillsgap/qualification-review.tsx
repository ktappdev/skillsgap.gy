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
  const [findingChoices, setFindingChoices] = useState<Record<string, string>>(() => Object.fromEntries(initialFindings.map((finding) => [finding.id, finding.candidates[0]?.qualification_id ?? ""])));
  const [selectedQualification, setSelectedQualification] = useState(availableQualifications[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);

  async function confirmFinding(finding: ApplicantExtractionFindingView, qualificationId: string) {
    if (!qualificationId) return setMessage("Choose a translation first.");
    const result = await confirmExtractionFinding(finding.id, qualificationId);
    if (result.error) return setMessage(result.error);
    setFindings((current) => current.filter((item) => item.id !== finding.id));
    setMessage("Translation confirmed. Your role matches are being recalculated.");
    router.refresh();
  }

  async function rejectFinding(finding: ApplicantExtractionFindingView) {
    const result = await rejectExtractionFinding(finding.id);
    if (result.error) return setMessage(result.error);
    setFindings((current) => current.filter((item) => item.id !== finding.id));
    setMessage("Finding rejected. It will not affect your role matches.");
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
    setMessage("Translation corrected. Your role matches are being recalculated.");
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
    setMessage("Qualification added. Your role matches are being recalculated.");
  }

  async function remove(item: ApplicantQualificationView) {
    const result = await removeApplicantQualification(item.qualification_id);
    if (result.error) return setMessage(result.error);
    setQualifications((current) => current.filter((candidate) => candidate.id !== item.id));
    setMessage("Finding removed. It will not affect your role matches.");
  }

  const knownIds = new Set(qualifications.map((item) => item.qualification_id));
  return (
    <section className="border border-border bg-surface p-5 shadow-sm" aria-labelledby="qualification-review-heading">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Transferable strengths</p>
      <h2 id="qualification-review-heading" className="mt-2 text-xl font-semibold tracking-tight">See what your experience can become</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Possible translations stay pending until you choose one. Only confirmed skills affect your match score.</p>

      {findings.length > 0 ? <section className="mt-5 space-y-4" aria-labelledby="pending-findings-heading">
        <div><h3 id="pending-findings-heading" className="text-sm font-semibold text-foreground">Possible transfers from your CV</h3><p className="mt-1 text-sm leading-6 text-muted">We found these terms visually. Choose the meaning that best describes your experience.</p></div>
        {findings.map((finding) => <PendingFindingCard key={finding.id} finding={finding} availableQualifications={availableQualifications} selectedQualificationId={findingChoices[finding.id] ?? ""} onSelect={(qualificationId) => setFindingChoices((current) => ({ ...current, [finding.id]: qualificationId }))} onConfirm={(qualificationId) => { void confirmFinding(finding, qualificationId); }} onReject={() => { void rejectFinding(finding); }} />)}
      </section> : null}

      {qualifications.length > 0 ? <section className="mt-7" aria-labelledby="confirmed-strengths-heading"><h3 id="confirmed-strengths-heading" className="text-sm font-semibold text-foreground">Confirmed strengths</h3><ul className="mt-3 space-y-4" role="list">{qualifications.map((item) => <ConfirmedQualificationCard key={item.id} item={item} years={years[item.id] ?? ""} correction={corrections[item.id] ?? ""} availableQualifications={availableQualifications} onYearsChange={(value) => setYears((current) => ({ ...current, [item.id]: value }))} onCorrectionChange={(value) => setCorrections((current) => ({ ...current, [item.id]: value }))} onSaveYears={() => { void saveYears(item); }} onCorrect={() => { void correct(item); }} onRemove={() => { void remove(item); }} />)}</ul></section> : <p className="mt-5 border border-dashed border-border p-4 text-sm text-muted">No confirmed strengths are ready yet. Upload a CV, review its possible translations, or add a qualification below.</p>}

      {unmappedTerms.length > 0 ? <div className="mt-5 border-l-2 border-amber-400 bg-amber-50/60 p-4"><h3 className="text-sm font-semibold text-foreground">Could not translate safely yet</h3><p className="mt-1 text-sm leading-6 text-muted">We kept these CV terms private for your review, but they do not affect your match score. You can add a canonical qualification yourself if it applies.</p><ul className="mt-2 flex flex-wrap gap-2" role="list">{unmappedTerms.map((term) => <li key={term} className="border border-amber-200 bg-white px-2.5 py-1 text-xs text-foreground">{term}</li>)}</ul></div> : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row"><label className="sr-only" htmlFor="add-qualification">Add a qualification</label><select id="add-qualification" value={selectedQualification} onChange={(event) => setSelectedQualification(event.target.value)} className="min-h-11 flex-1 border border-border bg-surface px-3 text-sm"><option value="" disabled>Add a qualification</option>{availableQualifications.filter((item) => !knownIds.has(item.id)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button type="button" disabled={!selectedQualification} onClick={() => { void add(); }} className="min-h-11 border border-accent px-4 text-sm font-semibold text-accent hover:bg-teal-50 disabled:opacity-50">Add qualification</button></div>
      {message ? <p className="mt-3 text-sm text-muted" role="status">{message}</p> : null}
    </section>
  );
}

function PendingFindingCard({ finding, availableQualifications, selectedQualificationId, onSelect, onConfirm, onReject }: { finding: ApplicantExtractionFindingView; availableQualifications: Tables<"qualifications">[]; selectedQualificationId: string; onSelect: (qualificationId: string) => void; onConfirm: (qualificationId: string) => void; onReject: () => void }) {
  return <article className="border border-accent/30 bg-teal-50/30 p-4"><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Found in your CV</p><p className="mt-1 font-semibold text-foreground">{finding.original_term}</p></div><span className="hidden text-xl text-accent sm:block" aria-hidden="true">→</span><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">Possible oil-and-gas translations</p><p className="mt-1 text-sm text-muted">Not a certificate or job-eligibility decision.</p></div></div><p className="mt-3 border-l-2 border-border pl-3 text-sm leading-6 text-muted">“{finding.evidence}” · Page {finding.evidence_page} · Visual review</p><div className="mt-4 grid gap-3 md:grid-cols-2">{finding.candidates.map((candidate) => <div key={candidate.qualification_id} className={`border p-3 ${selectedQualificationId === candidate.qualification_id ? "border-accent bg-white" : "border-border bg-surface"}`}><label className="flex cursor-pointer items-start gap-3"><input type="radio" name={`finding-${finding.id}`} value={candidate.qualification_id} checked={selectedQualificationId === candidate.qualification_id} onChange={() => onSelect(candidate.qualification_id)} className="mt-1 size-4 accent-teal-700" /><span><span className="block font-semibold text-foreground">{candidate.qualificationName}</span><span className="mt-1 block text-xs uppercase tracking-[0.1em] text-muted">{formatCategory(candidate.category)}</span></span></label><button type="button" onClick={() => onConfirm(candidate.qualification_id)} className="mt-3 min-h-10 w-full border border-accent px-3 text-sm font-semibold text-accent hover:bg-teal-50">Choose this translation</button></div>)}</div><div className="mt-4 border-t border-border pt-4"><label className="block text-xs font-semibold text-muted">Choose a different active translation<select value={selectedQualificationId} onChange={(event) => onSelect(event.target.value)} className="mt-1 min-h-10 w-full border border-border bg-surface px-3 text-sm"><option value="">Select another qualification</option>{availableQualifications.filter((qualification) => !finding.candidates.some((candidate) => candidate.qualification_id === qualification.id)).map((qualification) => <option key={qualification.id} value={qualification.id}>{qualification.name}</option>)}</select></label><div className="mt-3 flex flex-wrap gap-3"><button type="button" disabled={!selectedQualificationId || finding.candidates.some((candidate) => candidate.qualification_id === selectedQualificationId)} onClick={() => onConfirm(selectedQualificationId)} className="min-h-10 border border-border px-3 text-sm font-semibold text-muted hover:border-accent hover:text-accent disabled:opacity-50">Choose a different translation</button><button type="button" onClick={onReject} className="min-h-10 text-sm font-semibold text-danger hover:underline">This does not apply</button></div></div></article>;
}

function ConfirmedQualificationCard({ item, years, correction, availableQualifications, onYearsChange, onCorrectionChange, onSaveYears, onCorrect, onRemove }: { item: ApplicantQualificationView; years: string; correction: string; availableQualifications: Tables<"qualifications">[]; onYearsChange: (value: string) => void; onCorrectionChange: (value: string) => void; onSaveYears: () => void; onCorrect: () => void; onRemove: () => void }) {
  return <li className="border border-border bg-surface-muted/40 p-4"><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Found in your CV</p><p className="mt-1 font-semibold text-foreground">{item.original_term ?? (item.source === "applicant_confirmed" ? "Added by you" : item.qualificationName)}</p></div><span className="hidden text-xl text-accent sm:block" aria-hidden="true">→</span><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">Confirmed oil-and-gas translation</p><p className="mt-1 font-semibold text-foreground">{item.qualificationName}</p></div></div>{item.evidence ? <p className="mt-3 border-l-2 border-border pl-3 text-sm leading-6 text-muted">“{item.evidence}”{item.evidence_page ? ` · Page ${item.evidence_page}, ${evidenceMethodLabel(item.evidence_method)}` : ""}</p> : null}<div className="mt-4 flex flex-wrap items-center gap-3"><span className="text-sm font-semibold text-emerald-800">Confirmed by you ✓</span><button type="button" onClick={onRemove} className="min-h-10 text-sm font-semibold text-danger hover:underline">Remove qualification</button></div><div className="mt-4 grid gap-3 border-t border-border pt-4 md:grid-cols-2"><div className="flex items-end gap-2"><label className="flex-1 text-xs font-semibold text-muted">Years of experience<input type="number" min={0} max={60} step="0.1" value={years} onChange={(event) => onYearsChange(event.target.value)} placeholder="Not specified" className="mt-1 min-h-10 w-full border border-border bg-surface px-3 text-sm font-normal" /></label><button type="button" onClick={onSaveYears} className="min-h-10 border border-border px-3 text-sm font-semibold text-muted hover:border-accent hover:text-accent">Save</button></div><div className="flex items-end gap-2"><label className="flex-1 text-xs font-semibold text-muted">Choose a different translation<select value={correction} onChange={(event) => onCorrectionChange(event.target.value)} className="mt-1 min-h-10 w-full border border-border bg-surface px-3 text-sm font-normal"><option value="">Select a skill</option>{availableQualifications.filter((qualification) => qualification.id !== item.qualification_id).map((qualification) => <option key={qualification.id} value={qualification.id}>{qualification.name}</option>)}</select></label><button type="button" disabled={!correction} onClick={onCorrect} className="min-h-10 border border-border px-3 text-sm font-semibold text-muted hover:border-accent hover:text-accent disabled:opacity-50">Correct</button></div></div></li>;
}

function formatCategory(category: Tables<"qualifications">["category"]): string {
  return category.replaceAll("_", " ");
}

function evidenceMethodLabel(method: Tables<"applicant_qualifications">["evidence_method"]): string {
  if (method === "ocr") return "OCR";
  if (method === "vision") return "visual review";
  return "CV text";
}
