"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ConfirmedQualificationCard, PendingFindingCard, type QualificationAction } from "./qualification-review-cards";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useMatchRecalculation } from "@/components/dashboard/match-recalculation-context";
import {
  addApplicantQualification,
  confirmExtractionFindings,
  correctApplicantQualification,
  rejectExtractionFindings,
  removeApplicantQualification,
  updateApplicantQualificationYears,
} from "@/lib/skillsgap/actions";
import type { MatchScoreGain } from "@/lib/skillsgap/actions";
import type { ApplicantExtractionFindingView, ApplicantQualificationView } from "@/lib/skillsgap/queries";
import type { Tables } from "@/lib/supabase/database.types";

type Props = {
  applicantId: string;
  hasResume: boolean;
  resumeScanFailed: boolean;
  initialFindings: ApplicantExtractionFindingView[];
  initialQualifications: ApplicantQualificationView[];
  availableQualifications: Tables<"qualifications">[];
  unmappedTerms: string[];
};

/** The removal request stays visible until the server confirms the skill is gone. */
type RemovalRequest = {
  title: string;
  description: string;
  confirmLabel: string;
  busyLabel: string;
  run: () => Promise<void>;
};

/**
 * Reads the pending keys (`action:itemId`) back as the action for one card, so a
 * card only ever shows busy for the action it started. Several actions can be in
 * flight at once, so this scans the whole collection instead of one slot.
 */
function pendingActionFor(pendingKeys: ReadonlySet<string>, itemId: string): QualificationAction | null {
  for (const key of pendingKeys) {
    const separator = key.indexOf(":");
    if (separator < 0 || key.slice(separator + 1) !== itemId) continue;
    return key.slice(0, separator) as QualificationAction;
  }
  return null;
}

export function QualificationReview({ applicantId, hasResume, resumeScanFailed, initialFindings, initialQualifications, availableQualifications, unmappedTerms }: Props) {
  const router = useRouter();
  const matchRecalculation = useMatchRecalculation();
  const [findings, setFindings] = useState(initialFindings);
  const receivedFindingIds = useRef(new Set(initialFindings.map((finding) => finding.id)));
  const [qualifications, setQualifications] = useState(initialQualifications);
  const [years, setYears] = useState<Record<string, string>>(() => Object.fromEntries(initialQualifications.map((item) => [item.id, item.years_experience?.toString() ?? ""])));
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [findingChoices, setFindingChoices] = useState<Record<string, string>>(() => Object.fromEntries(initialFindings.map((finding) => [finding.id, ""])));
  const [selectedQualification, setSelectedQualification] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isAddingQualification, setIsAddingQualification] = useState(false);
  const [matchGains, setMatchGains] = useState<MatchScoreGain[]>([]);
  const [pendingKeys, setPendingKeys] = useState<ReadonlySet<string>>(() => new Set<string>());
  const [removalRequest, setRemovalRequest] = useState<RemovalRequest | null>(null);

  // Several actions can be in flight at once, so each action only adds and clears
  // the key it owns instead of wiping whichever action started last.
  function addPending(key: string) {
    setPendingKeys((current) => (current.has(key) ? current : new Set(current).add(key)));
  }

  function clearPending(key: string) {
    setPendingKeys((current) => {
      if (!current.has(key)) return current;
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  }

  useEffect(() => {
    const arrivedFindings = initialFindings.filter((finding) => !receivedFindingIds.current.has(finding.id));
    if (arrivedFindings.length === 0) return;

    for (const finding of arrivedFindings) receivedFindingIds.current.add(finding.id);
    setFindings((current) => {
      const currentIds = new Set(current.map((finding) => finding.id));
      return [...current, ...arrivedFindings.filter((finding) => !currentIds.has(finding.id))];
    });
    setFindingChoices((current) => {
      const next = { ...current };
      for (const finding of arrivedFindings) {
        if (!(finding.id in next)) next[finding.id] = "";
      }
      return next;
    });
  }, [initialFindings]);

  async function confirmFindings(selectedFindings: Array<{ finding: ApplicantExtractionFindingView; qualificationId: string }>) {
    const selections = selectedFindings.flatMap(({ finding, qualificationId }) =>
      getSourceFindingIds(finding).map((findingId) => ({ findingId, qualificationId })),
    );
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
    setFindings((current) => current.flatMap((finding) => {
      const sourceFindingIds = getSourceFindingIds(finding).filter((findingId) => !result.confirmedFindingIds.includes(findingId));
      return sourceFindingIds.length > 0 ? [{ ...finding, sourceFindingIds }] : [];
    }));
    setIsConfirming(false);
    const confirmedItems = selectedFindings.flatMap(({ finding, qualificationId }) => {
      const wasConfirmed = getSourceFindingIds(finding).some((findingId) => result.confirmedFindingIds.includes(findingId));
      if (!wasConfirmed) return [];
      const qualification = availableQualifications.find((item) => item.id === qualificationId);
      if (!qualification) return [];
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
      // A partial failure still saved some skills, so the recalculation may or
      // may not be running. Clear the optimistic flag either way and let the
      // server-reported job status say whether work is still in flight — an
      // optimistic flag left standing here used to latch behind a spinner.
      setMessage(result.error);
      if (result.confirmedFindingIds.length === 0) matchRecalculation?.fail(result.error);
      else matchRecalculation?.settle();
      router.refresh();
      return;
    }
    setMatchGains(result.gains);
    const confirmedCount = selectedFindings.filter(({ finding }) =>
      getSourceFindingIds(finding).some((findingId) => result.confirmedFindingIds.includes(findingId)),
    ).length;
    setMessage(`${confirmedCount} skill${confirmedCount === 1 ? "" : "s"} confirmed.`);
    router.refresh();
  }

  function confirmSelectedFindings() {
    const selectedFindings = findings.flatMap((finding) => {
      const qualificationId = findingChoices[finding.id];
      return qualificationId ? [{ finding, qualificationId }] : [];
    });
    void confirmFindings(selectedFindings);
  }

  function confirmAllRecognizedFindings() {
    const recognizedFindings = findings.flatMap((finding) => {
      const bestCandidate = finding.candidates.reduce<typeof finding.candidates[number] | undefined>(
        (best, candidate) => !best || candidate.rank < best.rank ? candidate : best,
        undefined,
      );
      return bestCandidate ? [{ finding, qualificationId: bestCandidate.qualification_id }] : [];
    });

    setFindingChoices((current) => ({
      ...current,
      ...Object.fromEntries(recognizedFindings.map(({ finding, qualificationId }) => [finding.id, qualificationId])),
    }));
    void confirmFindings(recognizedFindings);
  }

  async function rejectFinding(finding: ApplicantExtractionFindingView) {
    const key = `dismiss:${finding.id}`;
    addPending(key);
    try {
      const result = await rejectExtractionFindings(getSourceFindingIds(finding));
      setFindings((current) => current.flatMap((item) => {
        const sourceFindingIds = getSourceFindingIds(item).filter((findingId) => !result.rejectedFindingIds.includes(findingId));
        return sourceFindingIds.length > 0 ? [{ ...item, sourceFindingIds }] : [];
      }));
      setMessage(result.error ?? "Suggestion dismissed. It will not affect your role matches.");
      router.refresh();
    } catch {
      setMessage("We couldn’t dismiss that suggestion. Please try again.");
    } finally {
      clearPending(key);
    }
  }

  async function saveYears(item: ApplicantQualificationView) {
    const key = `years:${item.id}`;
    const value = years[item.id] ?? "";
    addPending(key);
    try {
      const result = await updateApplicantQualificationYears(item.qualification_id, value);
      if (result.error) return setMessage(result.error);
      setQualifications((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, years_experience: value.trim() ? Number(value) : null, source: "applicant_confirmed", review_status: "confirmed" } : candidate));
      setMessage("Experience updated. This strength can now improve your role matches.");
    } catch {
      setMessage("We couldn’t update the experience value. Please try again.");
    } finally {
      clearPending(key);
    }
  }

  async function correct(item: ApplicantQualificationView) {
    const key = `correct:${item.id}`;
    const corrected = availableQualifications.find((qualification) => qualification.id === corrections[item.id]);
    if (!corrected) return setMessage("Choose the correct transferable skill.");
    addPending(key);
    try {
      const result = await correctApplicantQualification(item.qualification_id, corrected.id);
      if (result.error) return setMessage(result.error);
      setQualifications((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, qualification_id: corrected.id, qualificationName: corrected.name, source: "applicant_confirmed", review_status: "confirmed" } : candidate));
      setMessage("Skill corrected. Your role matches are being recalculated.");
    } catch {
      setMessage("We couldn’t correct that skill. Please try again.");
    } finally {
      clearPending(key);
    }
  }

  async function add() {
    const item = availableQualifications.find((qualification) => qualification.id === selectedQualification);
    if (!item || isAddingQualification) return;
    setIsAddingQualification(true);
    setMessage(null);
    try {
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
      setSelectedQualification("");
      setMessage("Skill added. Your role matches are being recalculated.");
      router.refresh();
    } catch {
      setMessage("We couldn’t add that skill. Please try again.");
    } finally {
      setIsAddingQualification(false);
    }
  }

  function requestRemove(item: ApplicantQualificationView) {
    setRemovalRequest({
      title: "Remove this confirmed skill?",
      description: `${item.qualificationName} will stop counting toward your role matches, including any training suggestions it unlocked. You can add it again at any time.`,
      confirmLabel: "Remove skill",
      busyLabel: "Removing…",
      run: () => removeQualification(item),
    });
  }

  async function removeQualification(item: ApplicantQualificationView) {
    const key = `remove:${item.id}`;
    addPending(key);
    try {
      const result = await removeApplicantQualification(item.qualification_id);
      if (result.error) return setMessage(result.error);
      setQualifications((current) => current.filter((candidate) => candidate.id !== item.id));
      setMessage("Skill removed. It will not affect your role matches.");
      // The database trigger and the realtime channel usually recalculate first;
      // this covers the case where the channel is unavailable.
      router.refresh();
    } catch {
      setMessage("We couldn’t remove that skill. Please try again.");
    } finally {
      clearPending(key);
    }
  }

  const knownIds = new Set(qualifications.map((item) => item.qualification_id));
  const selectedFindingCount = findings.filter((finding) => Boolean(findingChoices[finding.id])).length;
  const recognizedFindingCount = findings.filter((finding) => finding.candidates.length > 0).length;
  return (
    <section id="skills-review" className="scroll-mt-6 rounded-lg border border-border bg-surface p-5" aria-labelledby="qualification-review-heading">
      <h2 id="qualification-review-heading" className="text-xl font-semibold tracking-tight text-foreground">{findings.length > 0 ? "Check the skills we found" : qualifications.length > 0 ? "Your confirmed skills" : "Add your skills"}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{findings.length > 0 ? "Select the skills that describe you, then confirm. Only confirmed skills count toward job matches." : qualifications.length > 0 ? "These skills are used to find your job matches. You can edit them or add a missing skill below." : resumeScanFailed ? "We couldn’t read your CV. Retry the upload or add skills yourself below." : hasResume ? "We didn’t find any skills to confirm. Add a skill below to start finding job matches." : "No CV is needed to start. Describe your work above or add skills you already have and we’ll compare them with active roles."}</p>

      {findings.length > 0 ? <section className="mt-5 space-y-4" aria-labelledby="pending-findings-heading">
        <div><h3 id="pending-findings-heading" className="text-sm font-semibold text-foreground">{findings.length} suggestions to review</h3><p className="mt-1 text-sm leading-6 text-muted">Choose the skill that best describes your experience, or dismiss it if it does not apply.</p></div>
        {findings.map((finding) => <PendingFindingCard key={finding.id} finding={finding} availableQualifications={availableQualifications} selectedQualificationId={findingChoices[finding.id] ?? ""} pending={pendingActionFor(pendingKeys, finding.id)} onSelect={(qualificationId) => setFindingChoices((current) => ({ ...current, [finding.id]: qualificationId }))} onReject={() => { void rejectFinding(finding); }} />)}
        <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-lg border border-accent/30 bg-surface p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">{selectedFindingCount === 0 ? "Select the skills that describe you" : `${selectedFindingCount} skill${selectedFindingCount === 1 ? "" : "s"} ready to confirm`}</p>
            {recognizedFindingCount > 0 ? <p className="mt-1 text-xs leading-5 text-muted">Confirm all uses the top suggested skill for each recognized term. Review a suggestion first if you want a different match.</p> : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" disabled={recognizedFindingCount === 0 || isConfirming} onClick={confirmAllRecognizedFindings} className="inline-flex min-h-11 items-center justify-center rounded-md border border-accent px-4 text-sm font-semibold text-accent hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50">
              {isConfirming ? "Saving your skills…" : `Confirm all recognized${recognizedFindingCount > 0 ? ` (${recognizedFindingCount})` : ""}`}
            </button>
            <button type="button" disabled={selectedFindingCount === 0 || isConfirming} onClick={confirmSelectedFindings} className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50">
              {isConfirming ? "Saving your skills…" : `Confirm selected${selectedFindingCount > 0 ? ` (${selectedFindingCount})` : ""}`}
            </button>
          </div>
        </div>
      </section> : null}

      {matchGains.length > 0 ? <section className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4" aria-labelledby="match-gains-heading">
        <h3 id="match-gains-heading" className="text-sm font-semibold text-emerald-900">Your matches just improved</h3>
        <ul className="mt-2 space-y-1" role="list">{matchGains.map((gain) => <li key={gain.roleId} className="text-sm font-semibold text-emerald-800">+{gain.points}% to {gain.roleTitle}</li>)}</ul>
      </section> : null}

      {qualifications.length > 0 ? <details className="mt-6"><summary className="cursor-pointer py-2 text-sm font-semibold text-foreground">Confirmed skills ({qualifications.length}) · View or edit</summary><ul className="mt-3 space-y-4" role="list">{qualifications.map((item) => <ConfirmedQualificationCard key={item.id} item={item} years={years[item.id] ?? ""} correction={corrections[item.id] ?? ""} availableQualifications={availableQualifications} pending={pendingActionFor(pendingKeys, item.id)} onYearsChange={(value) => setYears((current) => ({ ...current, [item.id]: value }))} onCorrectionChange={(value) => setCorrections((current) => ({ ...current, [item.id]: value }))} onSaveYears={() => { void saveYears(item); }} onCorrect={() => { void correct(item); }} onRemove={() => requestRemove(item)} />)}</ul></details> : <p className="mt-3 rounded-lg border border-dashed border-border p-4 text-sm text-muted">{findings.length > 0 ? "No skills confirmed yet. Choose a suggestion above or add a skill below." : "No skills confirmed yet. Add a skill to start comparing your experience with active roles."}</p>}

      {unmappedTerms.length > 0 ? <div className="mt-3 rounded-lg border border-border bg-surface-muted p-4"><h3 className="text-sm font-semibold text-foreground">Kept private for your review</h3><p className="mt-1 text-sm leading-6 text-muted">These terms didn&apos;t match an approved skill, so they don&apos;t affect your matches. Add a matching skill below if one applies.</p><ul className="mt-2 flex flex-wrap gap-2" role="list">{unmappedTerms.map((term) => <li key={term} className="border border-amber-200 bg-white px-2.5 py-1 text-xs text-foreground">{term}</li>)}</ul></div> : null}

      <details open={findings.length === 0 && qualifications.length === 0} className="mt-6 border-t border-border pt-5">
        <summary className="cursor-pointer py-2 text-sm font-semibold text-foreground">{hasResume && !resumeScanFailed ? "Add a missing skill" : "Add your skills"}</summary>
        <p className="mt-1 text-sm leading-6 text-muted">{hasResume && !resumeScanFailed ? "Add a skill we did not find in your CV." : "Choose a skill that describes work you have done, then add it to your profile."}</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1 text-xs font-semibold text-muted" htmlFor="add-qualification">
            Choose a skill
            <select id="add-qualification" value={selectedQualification} onChange={(event) => setSelectedQualification(event.target.value)} className="mt-1 min-h-11 w-full min-w-0 rounded-md border border-border bg-surface px-3 text-base font-normal sm:text-sm">
              <option value="" disabled>Select a skill</option>
              {availableQualifications.filter((item) => !knownIds.has(item.id)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <button type="button" disabled={!selectedQualification || isAddingQualification} onClick={() => { void add(); }} className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-accent px-4 text-sm font-semibold text-accent hover:bg-surface-muted disabled:cursor-wait disabled:opacity-50 sm:w-auto">{isAddingQualification ? "Adding…" : "Add skill"}</button>
        </div>
      </details>
      {qualifications.length > 0 ? <a href="#matches-area" className="mt-5 inline-flex min-h-11 items-center font-semibold text-accent">View job matches ↓</a> : null}
      {message ? <p className="mt-3 text-sm text-muted" role="status">{message}</p> : null}
      <ConfirmDialog
        open={removalRequest !== null}
        title={removalRequest?.title ?? ""}
        description={removalRequest?.description}
        confirmLabel={removalRequest?.confirmLabel}
        busyLabel={removalRequest?.busyLabel}
        cancelLabel="Keep skill"
        destructive
        onConfirm={async () => {
          await removalRequest?.run();
          setRemovalRequest(null);
        }}
        onCancel={() => setRemovalRequest(null)}
      />
    </section>
  );
}

function getSourceFindingIds(finding: ApplicantExtractionFindingView): string[] {
  return finding.sourceFindingIds ?? [finding.id];
}
