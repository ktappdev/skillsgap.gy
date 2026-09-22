"use client";

import { useMemo, useState } from "react";

import {
  createCareerPreparationSubject,
  createOccupationPathwayAction,
  setOccupationPathwayActionActive,
  setOccupationPathwayActionVerified,
  updateOccupationPathwayAction,
  updateOccupationTransferSummary,
  type OccupationPathwayActionInput,
} from "@/lib/skillsgap/actions";
import type { Tables } from "@/lib/supabase/database.types";

const actionTypes = ["learn", "practice", "register", "find_work", "guidance"] as const;
const inputClass = "min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent";
const panelClass = "rounded-lg border border-border bg-surface p-5 sm:p-6";

type CareerGuidanceManagerProps = {
  initialOccupations: Tables<"occupations">[];
  initialSubjects: Tables<"career_preparation_subjects">[];
  initialActions: Tables<"occupation_pathway_actions">[];
  trainingPrograms: Tables<"training_programs">[];
};

type ActionDraft = Omit<OccupationPathwayActionInput, "occupationId">;

function actionDraftFromAction(action: Tables<"occupation_pathway_actions">): ActionDraft {
  return {
    actionType: action.action_type,
    title: action.title,
    instruction: action.instruction,
    whyItHelps: action.why_it_helps,
    organizationName: action.organization_name,
    location: action.location ?? "",
    url: action.url,
    sourceUrl: action.source_url,
    sourceLocator: action.source_locator,
    sortOrder: action.sort_order,
    trainingProgramId: action.training_program_id,
  };
}

export function CareerGuidanceManager({ initialOccupations, initialSubjects, initialActions, trainingPrograms }: CareerGuidanceManagerProps) {
  const [occupations, setOccupations] = useState(initialOccupations);
  const [subjects, setSubjects] = useState(initialSubjects);
  const [actions, setActions] = useState(initialActions);
  const [selectedOccupationId, setSelectedOccupationId] = useState(initialOccupations[0]?.id ?? "");
  const [summary, setSummary] = useState(initialOccupations[0]?.industry_transfer_summary ?? "");
  const [subjectName, setSubjectName] = useState("");
  const [subjectNote, setSubjectNote] = useState("");
  const [subjectUrl, setSubjectUrl] = useState("https://education.gov.gy/en/index.php/media2/news-events/8159-guyana-s-future-workforce");
  const [subjectLocator, setSubjectLocator] = useState("National TVET Policy 2025–2035");
  const [actionDraft, setActionDraft] = useState<ActionDraft>({ actionType: "learn", title: "", instruction: "", whyItHelps: "", organizationName: "", location: "Guyana", url: "", sourceUrl: "", sourceLocator: "", sortOrder: 1, trainingProgramId: null });
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [savingAction, setSavingAction] = useState<string | null>(null);

  const selectedOccupation = occupations.find((occupation) => occupation.id === selectedOccupationId) ?? null;
  const occupationSubjects = useMemo(() => subjects.filter((subject) => subject.occupation_id === selectedOccupationId), [subjects, selectedOccupationId]);
  const occupationActions = useMemo(() => actions.filter((action) => action.occupation_id === selectedOccupationId).sort((first, second) => first.sort_order - second.sort_order), [actions, selectedOccupationId]);

  function selectOccupation(id: string) {
    setSelectedOccupationId(id);
    const occupation = occupations.find((item) => item.id === id);
    setSummary(occupation?.industry_transfer_summary ?? "");
    setEditingActionId(null);
    setMessage(null);
  }

  async function saveSummary() {
    if (savingAction) return;
    setSavingAction("summary");
    setMessage(null);
    try {
      const result = await updateOccupationTransferSummary(selectedOccupationId, summary);
      setMessage(result.error ?? "Transfer summary saved.");
      if (!result.error) setOccupations((current) => current.map((occupation) => occupation.id === selectedOccupationId ? { ...occupation, industry_transfer_summary: summary.trim() } : occupation));
    } catch {
      setMessage("We couldn’t save the transfer summary. Please try again.");
    } finally {
      setSavingAction(null);
    }
  }

  async function addSubject() {
    if (savingAction) return;
    setSavingAction("subject");
    setMessage(null);
    try {
      const result = await createCareerPreparationSubject(selectedOccupationId, subjectName, subjectNote, subjectUrl, subjectLocator);
      if (result.error) { setMessage(result.error); return; }
      const subject = result.subject;
      if (subject) setSubjects((current) => [...current, subject]);
      setSubjectName("");
      setSubjectNote("");
      setMessage("Preparation subject added.");
    } catch {
      setMessage("We couldn’t add that preparation subject. Please try again.");
    } finally {
      setSavingAction(null);
    }
  }

  async function saveAction() {
    if (savingAction) return;
    const input: OccupationPathwayActionInput = { occupationId: selectedOccupationId, ...actionDraft };
    const wasEditing = Boolean(editingActionId);
    setSavingAction("action");
    setMessage(null);
    try {
      const result = editingActionId ? await updateOccupationPathwayAction(editingActionId, input) : await createOccupationPathwayAction(input);
      if (result.error) { setMessage(result.error); return; }
      const savedAction = result.action;
      if (savedAction) {
        setActions((current) => wasEditing ? current.map((action) => action.id === savedAction.id ? savedAction : action) : [...current, savedAction]);
      }
      setActionDraft({ actionType: "learn", title: "", instruction: "", whyItHelps: "", organizationName: "", location: "Guyana", url: "", sourceUrl: "", sourceLocator: "", sortOrder: 1, trainingProgramId: null });
      setEditingActionId(null);
      setMessage(wasEditing ? "Action updated. Verify it again if the source changed." : "Action added. Verify it before publishing it publicly.");
    } catch {
      setMessage("We couldn’t save that pathway action. Please try again.");
    } finally {
      setSavingAction(null);
    }
  }

  async function toggleVerified(action: Tables<"occupation_pathway_actions">) {
    if (savingAction) return;
    setSavingAction(`verify:${action.id}`);
    setMessage(null);
    try {
      const result = await setOccupationPathwayActionVerified(action.id, !action.is_verified);
      if (result.error) { setMessage(result.error); return; }
      setActions((current) => current.map((item) => item.id === action.id ? { ...item, is_verified: !action.is_verified, last_verified_at: !action.is_verified ? new Date().toISOString().slice(0, 10) : item.last_verified_at } : item));
      setMessage(action.is_verified ? "Action moved out of the verified public catalogue." : "Action verified and eligible for public results.");
    } catch {
      setMessage("We couldn’t update that verification. Please try again.");
    } finally {
      setSavingAction(null);
    }
  }

  async function toggleActive(action: Tables<"occupation_pathway_actions">) {
    if (savingAction) return;
    setSavingAction(`active:${action.id}`);
    setMessage(null);
    try {
      const result = await setOccupationPathwayActionActive(action.id, !action.is_active);
      if (result.error) { setMessage(result.error); return; }
      setActions((current) => current.map((item) => item.id === action.id ? { ...item, is_active: !action.is_active } : item));
      setMessage(action.is_active ? "Action deactivated." : "Action activated.");
    } catch {
      setMessage("We couldn’t update that action. Please try again.");
    } finally {
      setSavingAction(null);
    }
  }

  return <section className="mt-6 space-y-6" aria-label="Career guidance catalogue">
    <div className={panelClass}><label htmlFor="guidance-occupation" className="text-sm font-semibold text-foreground">Occupation</label><select id="guidance-occupation" value={selectedOccupationId} onChange={(event) => selectOccupation(event.target.value)} className={`${inputClass} mt-2`}>{occupations.map((occupation) => <option key={occupation.id} value={occupation.id}>{occupation.title}</option>)}</select></div>

    {selectedOccupation ? <>
      <fieldset disabled={savingAction !== null} aria-busy={savingAction !== null} className="contents">
      <div className={panelClass}><h2 className="text-xl font-semibold">Industry transfer summary</h2><p className="mt-2 text-sm leading-6 text-muted">This explanation appears publicly. Keep it evidence-based and avoid promises of employment.</p><label className="sr-only" htmlFor="guidance-transfer-summary">Transfer summary</label><textarea id="guidance-transfer-summary" value={summary} onChange={(event) => setSummary(event.target.value)} rows={5} className={`${inputClass} mt-4 py-2`} /><button type="button" onClick={() => { void saveSummary(); }} className="mt-3 min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong">Save transfer summary</button></div>

      <div className={panelClass}><h2 className="text-xl font-semibold">Preparation subjects</h2><p className="mt-2 text-sm leading-6 text-muted">Preparation signals, not employer requirements or grade cut-offs.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="sr-only" htmlFor="guidance-subject-name">Subject name</label><input id="guidance-subject-name" value={subjectName} onChange={(event) => setSubjectName(event.target.value)} placeholder="Subject, e.g. Mathematics" className={inputClass} /><label className="sr-only" htmlFor="guidance-subject-note">Why it helps</label><input id="guidance-subject-note" value={subjectNote} onChange={(event) => setSubjectNote(event.target.value)} placeholder="Why it helps" className={inputClass} /><label className="sr-only" htmlFor="guidance-subject-url">Source URL</label><input id="guidance-subject-url" value={subjectUrl} onChange={(event) => setSubjectUrl(event.target.value)} placeholder="HTTPS source URL" className={inputClass} /><label className="sr-only" htmlFor="guidance-subject-locator">Source location</label><input id="guidance-subject-locator" value={subjectLocator} onChange={(event) => setSubjectLocator(event.target.value)} placeholder="Source location" className={inputClass} /></div><button type="button" onClick={() => { void addSubject(); }} className="mt-3 min-h-11 rounded-md border border-accent px-4 text-sm font-semibold text-accent hover:bg-surface-muted">Add subject</button><ul className="mt-5 divide-y divide-border border-y border-border" aria-label="Preparation subjects">{occupationSubjects.map((subject) => <li key={subject.id} className="py-3 text-sm"><span className="font-semibold text-foreground">{subject.subject_name}</span><span className="ml-2 text-muted">{subject.guidance_note}</span><span className="mt-1 block text-xs text-muted">Source checked {subject.last_verified_at}</span></li>)}</ul></div>

      <div className={panelClass}><h2 className="text-xl font-semibold">{editingActionId ? "Edit pathway action" : "Add pathway action"}</h2><p className="mt-2 text-sm leading-6 text-muted">Only active and verified actions appear publicly. Use “Ask about current intake” when you cannot verify a specific course.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="sr-only" htmlFor="guidance-action-type">Action type</label><select id="guidance-action-type" value={actionDraft.actionType} onChange={(event) => setActionDraft((current) => ({ ...current, actionType: event.target.value as ActionDraft["actionType"] }))} className={inputClass}>{actionTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select><label className="sr-only" htmlFor="guidance-action-order">Display order</label><input id="guidance-action-order" type="number" min="1" max="20" value={actionDraft.sortOrder} onChange={(event) => setActionDraft((current) => ({ ...current, sortOrder: Number(event.target.value) }))} placeholder="Display order" className={inputClass} /><label className="sr-only" htmlFor="guidance-action-title">Action title</label><input id="guidance-action-title" value={actionDraft.title} onChange={(event) => setActionDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Action title" className={inputClass} /><label className="sr-only" htmlFor="guidance-action-org">Organization</label><input id="guidance-action-org" value={actionDraft.organizationName} onChange={(event) => setActionDraft((current) => ({ ...current, organizationName: event.target.value }))} placeholder="Organization" className={inputClass} /><label className="sr-only" htmlFor="guidance-action-location">Location</label><input id="guidance-action-location" value={actionDraft.location} onChange={(event) => setActionDraft((current) => ({ ...current, location: event.target.value }))} placeholder="Location" className={inputClass} /><label className="sr-only" htmlFor="guidance-action-program">Linked training program</label><select id="guidance-action-program" value={actionDraft.trainingProgramId ?? ""} onChange={(event) => setActionDraft((current) => ({ ...current, trainingProgramId: event.target.value || null }))} className={inputClass}><option value="">No linked training program</option>{trainingPrograms.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select><label className="sr-only" htmlFor="guidance-action-instruction">What the learner should do</label><textarea id="guidance-action-instruction" value={actionDraft.instruction} onChange={(event) => setActionDraft((current) => ({ ...current, instruction: event.target.value }))} placeholder="What should the learner do?" rows={3} className={`${inputClass} py-2 sm:col-span-2`} /><label className="sr-only" htmlFor="guidance-action-why">Why this helps</label><textarea id="guidance-action-why" value={actionDraft.whyItHelps} onChange={(event) => setActionDraft((current) => ({ ...current, whyItHelps: event.target.value }))} placeholder="Why does this help?" rows={3} className={`${inputClass} py-2 sm:col-span-2`} /><label className="sr-only" htmlFor="guidance-action-url">Public URL</label><input id="guidance-action-url" value={actionDraft.url} onChange={(event) => setActionDraft((current) => ({ ...current, url: event.target.value }))} placeholder="HTTPS public URL" className={inputClass} /><label className="sr-only" htmlFor="guidance-action-source-url">Source URL</label><input id="guidance-action-source-url" value={actionDraft.sourceUrl} onChange={(event) => setActionDraft((current) => ({ ...current, sourceUrl: event.target.value }))} placeholder="HTTPS source URL" className={inputClass} /><label className="sr-only" htmlFor="guidance-action-source-locator">Source location</label><input id="guidance-action-source-locator" value={actionDraft.sourceLocator} onChange={(event) => setActionDraft((current) => ({ ...current, sourceLocator: event.target.value }))} placeholder="Source location" className={inputClass} /></div><div className="mt-3 flex flex-wrap gap-3"><button type="button" onClick={() => { void saveAction(); }} className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong">{editingActionId ? "Save action" : "Add action"}</button>{editingActionId ? <button type="button" onClick={() => setEditingActionId(null)} className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-foreground">Cancel edit</button> : null}</div></div>

      <div className={panelClass}><h2 className="text-xl font-semibold">Published actions</h2><ul className="mt-4 space-y-3" aria-label="Pathway actions">{occupationActions.map((action) => <li key={action.id} className="rounded-md border border-border p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div className="min-w-0"><p className="font-semibold text-foreground">{action.title}</p><p className="mt-1 text-sm text-muted">{action.action_type} · {action.organization_name} · checked {action.last_verified_at}</p><p className="mt-2 text-sm leading-6 text-muted">{action.instruction}</p></div><div className="flex shrink-0 flex-wrap gap-2"><button type="button" onClick={() => { setEditingActionId(action.id); setActionDraft(actionDraftFromAction(action)); }} className="min-h-11 rounded-md border border-border px-3 text-sm font-semibold text-foreground hover:border-accent hover:text-accent">Edit</button><button type="button" onClick={() => { void toggleVerified(action); }} aria-pressed={action.is_verified} className={`min-h-11 rounded-md px-3 text-sm font-semibold ${action.is_verified ? "bg-accent text-white hover:bg-accent-strong" : "border border-accent text-accent hover:bg-surface-muted"}`}>{action.is_verified ? "Verified" : "Verify"}</button><button type="button" onClick={() => { void toggleActive(action); }} aria-pressed={action.is_active} className="min-h-11 rounded-md border border-border px-3 text-sm font-semibold text-foreground">{action.is_active ? "Deactivate" : "Activate"}</button></div></div></li>)}</ul>{occupationActions.length === 0 ? <p className="mt-4 text-sm text-muted">No actions yet. Add the first concrete next step above.</p> : null}</div>
      </fieldset>
    </> : <p className="rounded-lg border border-border bg-surface p-5 text-sm text-muted">No occupation records are available.</p>}
    {savingAction ? <p className="text-sm text-muted" role="status">Saving catalogue changes…</p> : null}
    {message ? <p className="text-sm text-muted" role="status">{message}</p> : null}
  </section>;
}
