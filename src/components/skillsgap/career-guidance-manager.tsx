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
const inputClass = "min-h-11 w-full border border-border bg-surface px-3 text-sm outline-none focus:border-accent";

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
    const result = await updateOccupationTransferSummary(selectedOccupationId, summary);
    setMessage(result.error ?? "Transfer summary saved.");
    if (!result.error) setOccupations((current) => current.map((occupation) => occupation.id === selectedOccupationId ? { ...occupation, industry_transfer_summary: summary.trim() } : occupation));
  }

  async function addSubject() {
    const result = await createCareerPreparationSubject(selectedOccupationId, subjectName, subjectNote, subjectUrl, subjectLocator);
    if (result.error) { setMessage(result.error); return; }
    if (result.subject) setSubjects((current) => [...current, result.subject!]);
    setSubjectName("");
    setSubjectNote("");
    setMessage("Preparation subject added.");
  }

  async function saveAction() {
    const input: OccupationPathwayActionInput = { occupationId: selectedOccupationId, ...actionDraft };
    const result = editingActionId ? await updateOccupationPathwayAction(editingActionId, input) : await createOccupationPathwayAction(input);
    if (result.error) { setMessage(result.error); return; }
    if (result.action) {
      setActions((current) => editingActionId ? current.map((action) => action.id === result.action!.id ? result.action! : action) : [...current, result.action!]);
    }
    setActionDraft({ actionType: "learn", title: "", instruction: "", whyItHelps: "", organizationName: "", location: "Guyana", url: "", sourceUrl: "", sourceLocator: "", sortOrder: 1, trainingProgramId: null });
    setEditingActionId(null);
    setMessage(editingActionId ? "Action updated. Verify it again if the source changed." : "Action added. Verify it before publishing it publicly.");
  }

  async function toggleVerified(action: Tables<"occupation_pathway_actions">) {
    const result = await setOccupationPathwayActionVerified(action.id, !action.is_verified);
    if (result.error) { setMessage(result.error); return; }
    setActions((current) => current.map((item) => item.id === action.id ? { ...item, is_verified: !action.is_verified, last_verified_at: !action.is_verified ? new Date().toISOString().slice(0, 10) : item.last_verified_at } : item));
    setMessage(action.is_verified ? "Action moved out of the verified public catalogue." : "Action verified and eligible for public results.");
  }

  async function toggleActive(action: Tables<"occupation_pathway_actions">) {
    const result = await setOccupationPathwayActionActive(action.id, !action.is_active);
    if (result.error) { setMessage(result.error); return; }
    setActions((current) => current.map((item) => item.id === action.id ? { ...item, is_active: !action.is_active } : item));
    setMessage(action.is_active ? "Action deactivated." : "Action activated.");
  }

  return <section className="mt-8 space-y-5">
    <div className="border border-border bg-surface p-5 shadow-sm"><label htmlFor="guidance-occupation" className="text-sm font-semibold text-foreground">Occupation catalogue record</label><select id="guidance-occupation" value={selectedOccupationId} onChange={(event) => selectOccupation(event.target.value)} className={`${inputClass} mt-3`}>{occupations.map((occupation) => <option key={occupation.id} value={occupation.id}>{occupation.title}</option>)}</select></div>

    {selectedOccupation ? <>
      <div className="border border-border bg-surface p-5 shadow-sm"><h2 className="text-lg font-semibold">How this transfers into oil and gas</h2><p className="mt-2 text-sm leading-6 text-muted">This explanation appears publicly. Keep it evidence-based and avoid promises of employment.</p><textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={5} className="mt-4 w-full border border-border bg-surface p-3 text-sm outline-none focus:border-accent" /><button type="button" onClick={() => { void saveSummary(); }} className="mt-3 min-h-11 bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong">Save transfer summary</button></div>

      <div className="border border-border bg-surface p-5 shadow-sm"><h2 className="text-lg font-semibold">Preparation subjects</h2><p className="mt-2 text-sm leading-6 text-muted">These are preparation signals, not employer requirements or grade cut-offs.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><input value={subjectName} onChange={(event) => setSubjectName(event.target.value)} placeholder="Subject, e.g. Mathematics" className={inputClass} /><input value={subjectNote} onChange={(event) => setSubjectNote(event.target.value)} placeholder="Why it helps" className={inputClass} /><input value={subjectUrl} onChange={(event) => setSubjectUrl(event.target.value)} placeholder="HTTPS source URL" className={inputClass} /><input value={subjectLocator} onChange={(event) => setSubjectLocator(event.target.value)} placeholder="Source location" className={inputClass} /></div><button type="button" onClick={() => { void addSubject(); }} className="mt-3 min-h-11 border border-accent px-4 text-sm font-semibold text-accent hover:bg-teal-50">Add subject</button><ul className="mt-5 divide-y divide-border border-y border-border">{occupationSubjects.map((subject) => <li key={subject.id} className="py-3 text-sm"><span className="font-semibold text-foreground">{subject.subject_name}</span><span className="ml-2 text-muted">{subject.guidance_note}</span><span className="mt-1 block text-xs text-muted">Source checked {subject.last_verified_at}</span></li>)}</ul></div>

      <div className="border border-border bg-surface p-5 shadow-sm"><h2 className="text-lg font-semibold">{editingActionId ? "Edit pathway action" : "Add pathway action"}</h2><p className="mt-2 text-sm leading-6 text-muted">Only active and verified actions appear publicly. Use “Ask about current intake” when you cannot verify a specific course.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><select value={actionDraft.actionType} onChange={(event) => setActionDraft((current) => ({ ...current, actionType: event.target.value as ActionDraft["actionType"] }))} className={inputClass}>{actionTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select><input type="number" min="1" max="20" value={actionDraft.sortOrder} onChange={(event) => setActionDraft((current) => ({ ...current, sortOrder: Number(event.target.value) }))} placeholder="Display order" className={inputClass} /><input value={actionDraft.title} onChange={(event) => setActionDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Action title" className={inputClass} /><input value={actionDraft.organizationName} onChange={(event) => setActionDraft((current) => ({ ...current, organizationName: event.target.value }))} placeholder="Organization" className={inputClass} /><input value={actionDraft.location} onChange={(event) => setActionDraft((current) => ({ ...current, location: event.target.value }))} placeholder="Location" className={inputClass} /><select value={actionDraft.trainingProgramId ?? ""} onChange={(event) => setActionDraft((current) => ({ ...current, trainingProgramId: event.target.value || null }))} className={inputClass}><option value="">No linked training program</option>{trainingPrograms.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select><textarea value={actionDraft.instruction} onChange={(event) => setActionDraft((current) => ({ ...current, instruction: event.target.value }))} placeholder="What should the learner do?" rows={3} className="w-full border border-border bg-surface p-3 text-sm outline-none focus:border-accent sm:col-span-2" /><textarea value={actionDraft.whyItHelps} onChange={(event) => setActionDraft((current) => ({ ...current, whyItHelps: event.target.value }))} placeholder="Why does this help?" rows={3} className="w-full border border-border bg-surface p-3 text-sm outline-none focus:border-accent sm:col-span-2" /><input value={actionDraft.url} onChange={(event) => setActionDraft((current) => ({ ...current, url: event.target.value }))} placeholder="HTTPS public URL" className={inputClass} /><input value={actionDraft.sourceUrl} onChange={(event) => setActionDraft((current) => ({ ...current, sourceUrl: event.target.value }))} placeholder="HTTPS source URL" className={inputClass} /><input value={actionDraft.sourceLocator} onChange={(event) => setActionDraft((current) => ({ ...current, sourceLocator: event.target.value }))} placeholder="Source location" className={inputClass} /></div><div className="mt-3 flex flex-wrap gap-3"><button type="button" onClick={() => { void saveAction(); }} className="min-h-11 bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong">{editingActionId ? "Save action" : "Add action"}</button>{editingActionId ? <button type="button" onClick={() => setEditingActionId(null)} className="min-h-11 border border-border px-4 text-sm font-semibold text-foreground">Cancel edit</button> : null}</div></div>

      <div className="border border-border bg-surface p-5 shadow-sm"><h2 className="text-lg font-semibold">Published action cards</h2><ul className="mt-4 space-y-3">{occupationActions.map((action) => <li key={action.id} className="border border-border p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="font-semibold text-foreground">{action.title}</p><p className="mt-1 text-sm text-muted">{action.action_type} · {action.organization_name} · checked {action.last_verified_at}</p><p className="mt-2 text-sm leading-6 text-muted">{action.instruction}</p></div><div className="flex shrink-0 flex-wrap gap-2"><button type="button" onClick={() => { setEditingActionId(action.id); setActionDraft(actionDraftFromAction(action)); }} className="min-h-10 border border-border px-3 text-sm font-semibold text-foreground hover:border-accent hover:text-accent">Edit</button><button type="button" onClick={() => { void toggleVerified(action); }} className={`min-h-10 px-3 text-sm font-semibold ${action.is_verified ? "bg-emerald-700 text-white" : "border border-accent text-accent hover:bg-teal-50"}`}>{action.is_verified ? "Verified" : "Verify"}</button><button type="button" onClick={() => { void toggleActive(action); }} className="min-h-10 border border-border px-3 text-sm font-semibold text-foreground">{action.is_active ? "Deactivate" : "Activate"}</button></div></div></li>)}</ul>{occupationActions.length === 0 ? <p className="mt-4 text-sm text-muted">No actions yet. Add the first concrete next step above.</p> : null}</div>
    </> : <p className="border border-border bg-surface p-5 text-sm text-muted">No occupation records are available.</p>}
    {message ? <p className="text-sm text-muted" role="status">{message}</p> : null}
  </section>;
}
