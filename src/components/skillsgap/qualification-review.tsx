"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ConfirmedQualificationCard, PendingFindingCard } from "./qualification-review-cards";

import { useMatchRecalculation } from "@/components/dashboard/match-recalculation-context";
import {
  addApplicantQualification,
  confirmExtractionFindings,
  correctApplicantQualification,
  rejectExtractionFinding,
  removeApplicantQualification,
  updateApplicantQualificationYears,
} from "@/lib/skillsgap/actions";
import type { MatchScoreGain } from "@/lib/skillsgap/actions";
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
  const matchRecalculation = useMatchRecalculation();
  const [findings, setFindings] = useState(initialFindings);
  const [qualifications, setQualifications] = useState(initialQualifications);
  const [years, setYears] = useState<Record<string, string>>(() => Object.fromEntries(initialQualifications.map((item) => [item.id, item.years_experience?.toString() ?? ""])));
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [findingChoices, setFindingChoices] = useState<Record<string, string>>(() => Object.fromEntries(initialFindings.map((finding) => [finding.id, ""])));
  const [selectedQualification, setSelectedQualification] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [matchGains, setMatchGains] = useState<MatchScoreGain[]>([]);

  async function confirmSelectedFindings() {
    const selections = findings.flatMap((finding) => {
      const qualificationId = findingChoices[finding.id];
      return qualificationId ? [{ findingId: finding.id, qualificationId }] : [];
    });
    if (selections.length === 0) return setMessage("Choose at least one skill to confirm.");

    setIsConfirming(true);
    setMessage(null);
    setMatchGains([]);
    matchRecalculation?.begin();
    let result: Awaited<ReturnType<typeof confirmExtractionFindings>>;
    try {
      result = await confirmExtractionFindings(selections);
    } catch {
      const failureMessage = "We could not confirm those skills. Please try again.";
      setIsConfirming(false);
      setMessage(failureMessage);
      matchRecalculation?.fail(failureMessage);
      return;
    }
    setFindings((current) => current.filter((finding) => !result.confirmedFindingIds.includes(finding.id)));
    setIsConfirming(false);
    const confirmedItems = result.confirmedFindingIds.flatMap((findingId) => {
      const finding = findings.find((item) => item.id === findingId);
      const qualificationId = findingChoices[findingId];
      const qualification = availableQualifications.find((item) => item.id === qualificationId);
      if (!finding || !qualification) return [];
      return [{
        id: crypto.randomUUID(),
        applicant_id: applicantId,
        qualification_id: qualification.id,
        qualificationName: qualification.name,
        resume_id: finding.resume_id,
        years_experience: finding.years_experience,
        source: "applicant_confirmed" as const,
        review_status: "confirmed" as const,
        original_term: finding.original_term,
        evidence: finding.evidence,
        evidence_page: finding.evidence_page,
        evidence_method: finding.evidence_method,
        confidence: finding.confidence,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }];
    });
    setQualifications((current) => [
      ...current,
      ...confirmedItems.filter((item) => !current.some((existing) => existing.qualification_id === item.qualification_id)),
    ]);
    if (result.error) {
      setMessage(result.error);
      if (result.confirmedFindingIds.length === 0) matchRecalculation?.fail(result.error);
      router.refresh();
      return;
    }
    setMatchGains(result.gains);
    setMessage(`${result.confirmedFindingIds.length} skill${result.confirmedFindingIds.length === 1 ? "" : "s"} confirmed.`);
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
  const selectedFindingCount = findings.filter((finding) => Boolean(findingChoices[finding.id])).length;
  return (
    <section id="skills-review" className="scroll-mt-6 rounded-lg border border-border bg-surface p-5" aria-labelledby="qualification-review-heading">
      <h2 id="qualification-review-heading" className="text-xl font-semibold tracking-tight text-foreground">{findings.length > 0 ? "Check the skills we found" : qualifications.length > 0 ? "Your confirmed skills" : "Add your skills"}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{findings.length > 0 ? "Select the skills that describe you, then confirm. Only confirmed skills count toward job matches." : qualifications.length > 0 ? "These skills are used to find your job matches. You can edit them or add a missing skill below." : "We didn’t find any skills to confirm. Add a skill below to start finding job matches."}</p>

      {findings.length > 0 ? <section className="mt-5 space-y-4" aria-labelledby="pending-findings-heading">
        <div><h3 id="pending-findings-heading" className="text-sm font-semibold text-foreground">{findings.length} suggestions to review</h3><p className="mt-1 text-sm leading-6 text-muted">Choose the skill that best describes your experience, or dismiss it if it does not apply.</p></div>
        {findings.map((finding) => <PendingFindingCard key={finding.id} finding={finding} availableQualifications={availableQualifications} selectedQualificationId={findingChoices[finding.id] ?? ""} onSelect={(qualificationId) => setFindingChoices((current) => ({ ...current, [finding.id]: qualificationId }))} onReject={() => { void rejectFinding(finding); }} />)}
        <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-lg border border-accent/30 bg-surface p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-foreground">{selectedFindingCount === 0 ? "Select the skills that describe you" : `${selectedFindingCount} skill${selectedFindingCount === 1 ? "" : "s"} ready to confirm`}</p>
          <button type="button" disabled={selectedFindingCount === 0 || isConfirming} onClick={() => { void confirmSelectedFindings(); }} className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50">
            {isConfirming ? "Saving your skills…" : `Confirm selected${selectedFindingCount > 0 ? ` (${selectedFindingCount})` : ""}`}
          </button>
        </div>
      </section> : null}

      {matchGains.length > 0 ? <section className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4" aria-labelledby="match-gains-heading">
        <h3 id="match-gains-heading" className="text-sm font-semibold text-emerald-900">Your matches just improved</h3>
        <ul className="mt-2 space-y-1" role="list">{matchGains.map((gain) => <li key={gain.roleId} className="text-sm font-semibold text-emerald-800">+{gain.points}% to {gain.roleTitle}</li>)}</ul>
      </section> : null}

      {qualifications.length > 0 ? <details className="mt-6"><summary className="cursor-pointer py-2 text-sm font-semibold text-foreground">Confirmed skills ({qualifications.length}) · View or edit</summary><ul className="mt-3 space-y-4" role="list">{qualifications.map((item) => <ConfirmedQualificationCard key={item.id} item={item} years={years[item.id] ?? ""} correction={corrections[item.id] ?? ""} availableQualifications={availableQualifications} onYearsChange={(value) => setYears((current) => ({ ...current, [item.id]: value }))} onCorrectionChange={(value) => setCorrections((current) => ({ ...current, [item.id]: value }))} onSaveYears={() => { void saveYears(item); }} onCorrect={() => { void correct(item); }} onRemove={() => { void remove(item); }} />)}</ul></details> : <p className="mt-3 rounded-lg border border-dashed border-border p-4 text-sm text-muted">No skills confirmed yet. Choose a suggestion above or add a skill below.</p>}

      {unmappedTerms.length > 0 ? <div className="mt-3 rounded-lg border border-border bg-surface-muted p-4"><h3 className="text-sm font-semibold text-foreground">Kept private for your review</h3><p className="mt-1 text-sm leading-6 text-muted">These CV terms don&apos;t affect matches. Add a matching skill below if one applies.</p><ul className="mt-2 flex flex-wrap gap-2" role="list">{unmappedTerms.map((term) => <li key={term} className="border border-amber-200 bg-white px-2.5 py-1 text-xs text-foreground">{term}</li>)}</ul></div> : null}

      <details open={findings.length === 0 && qualifications.length === 0} className="mt-6 border-t border-border pt-5">
        <summary className="cursor-pointer py-2 text-sm font-semibold text-foreground">Add a missing skill</summary>
        <p className="mt-1 text-sm leading-6 text-muted">Add a skill we did not find in your CV.</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1 text-xs font-semibold text-muted" htmlFor="add-qualification">
            Choose a skill
            <select id="add-qualification" value={selectedQualification} onChange={(event) => setSelectedQualification(event.target.value)} className="mt-1 min-h-11 w-full min-w-0 rounded-md border border-border bg-surface px-3 text-base font-normal sm:text-sm">
              <option value="" disabled>Select a skill</option>
              {availableQualifications.filter((item) => !knownIds.has(item.id)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <button type="button" disabled={!selectedQualification} onClick={() => { void add(); }} className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-accent px-4 text-sm font-semibold text-accent hover:bg-surface-muted disabled:opacity-50 sm:w-auto">Add skill</button>
        </div>
      </details>
      {qualifications.length > 0 ? <a href="#matches-area" className="mt-5 inline-flex min-h-11 items-center font-semibold text-accent">View job matches ↓</a> : null}
      {message ? <p className="mt-3 text-sm text-muted" role="status">{message}</p> : null}
    </section>
  );
}
