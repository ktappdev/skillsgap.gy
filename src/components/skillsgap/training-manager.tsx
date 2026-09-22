"use client";

import { useState } from "react";

import { createTrainingProgram, createTrainingProvider, mapTrainingOutcome, setTrainingProviderVerified } from "@/lib/skillsgap/actions";
import type { Tables } from "@/lib/supabase/database.types";

type TrainingManagerProps = {
  initialProviders: Tables<"training_providers">[];
  initialPrograms: Tables<"training_programs">[];
  initialOutcomes: Tables<"training_program_outcomes">[];
  qualifications: Tables<"qualifications">[];
};

const panelClass = "rounded-lg border border-border bg-surface p-5 sm:p-6";
const inputClass = "min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent";

export function TrainingManager({ initialProviders, initialPrograms, initialOutcomes, qualifications }: TrainingManagerProps) {
  const [providers, setProviders] = useState(initialProviders);
  const [programs, setPrograms] = useState(initialPrograms);
  const [outcomes, setOutcomes] = useState(initialOutcomes);
  const [providerName, setProviderName] = useState("");
  const [providerLocation, setProviderLocation] = useState("Georgetown, Guyana");
  const [providerDescription, setProviderDescription] = useState("");
  const [programProviderId, setProgramProviderId] = useState(initialProviders[0]?.id ?? "");
  const [programName, setProgramName] = useState("");
  const [programDuration, setProgramDuration] = useState("");
  const [programUrl, setProgramUrl] = useState("");
  const [outcomeProgramId, setOutcomeProgramId] = useState(initialPrograms[0]?.id ?? "");
  const [outcomeQualificationId, setOutcomeQualificationId] = useState(qualifications[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [savingAction, setSavingAction] = useState<string | null>(null);

  async function addProvider() {
    if (savingAction) return;
    setSavingAction("provider");
    setMessage(null);
    try {
      const result = await createTrainingProvider(providerName, providerLocation, providerDescription);
      if (result.error) { setMessage(result.error); return; }
      const provider = result.provider;
      if (provider) { setProviders((current) => [...current, provider]); setProgramProviderId(provider.id); }
      setProviderName(""); setProviderDescription(""); setMessage("Provider added. Verify it before recommending its programs.");
    } catch {
      setMessage("We couldn’t add that provider. Please try again.");
    } finally {
      setSavingAction(null);
    }
  }

  async function addProgram() {
    if (savingAction) return;
    setSavingAction("program");
    setMessage(null);
    try {
      const result = await createTrainingProgram(programProviderId, programName, programDuration, programUrl);
      if (result.error) { setMessage(result.error); return; }
      const program = result.program;
      if (program) { setPrograms((current) => [...current, program]); setOutcomeProgramId(program.id); }
      setProgramName(""); setProgramDuration(""); setProgramUrl(""); setMessage("Program added. Map the qualification it delivers.");
    } catch {
      setMessage("We couldn’t add that program. Please try again.");
    } finally {
      setSavingAction(null);
    }
  }

  async function addOutcome() {
    if (savingAction) return;
    setSavingAction("outcome");
    setMessage(null);
    try {
      const result = await mapTrainingOutcome(outcomeProgramId, outcomeQualificationId);
      if (result.error) { setMessage(result.error); return; }
      if (!outcomes.some((outcome) => outcome.training_program_id === outcomeProgramId && outcome.qualification_id === outcomeQualificationId)) {
        setOutcomes((current) => [...current, { training_program_id: outcomeProgramId, qualification_id: outcomeQualificationId, created_at: new Date().toISOString() }]);
      }
      setMessage("Program outcome mapped.");
    } catch {
      setMessage("We couldn’t map that outcome. Please try again.");
    } finally {
      setSavingAction(null);
    }
  }

  async function toggle(provider: Tables<"training_providers">) {
    if (savingAction) return;
    setSavingAction(`provider:${provider.id}`);
    setMessage(null);
    try {
      const result = await setTrainingProviderVerified(provider.id, !provider.is_verified);
      if (result.error) { setMessage(result.error); return; }
      setProviders((current) => current.map((item) => item.id === provider.id ? { ...item, is_verified: !item.is_verified } : item));
      setMessage(provider.is_verified ? "Provider marked as not verified." : "Provider verified and eligible for recommendations.");
    } catch {
      setMessage("We couldn’t update that provider. Please try again.");
    } finally {
      setSavingAction(null);
    }
  }

  return (
    <section className="mt-6 space-y-6" aria-label="Training management">
      <div className={panelClass}>
        <h2 className="text-xl font-semibold">Add a local provider</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="sr-only" htmlFor="training-provider-name">Provider name</label>
          <input id="training-provider-name" value={providerName} onChange={(event) => setProviderName(event.target.value)} placeholder="Provider name" className={inputClass} />
          <label className="sr-only" htmlFor="training-provider-location">Provider location</label>
          <input id="training-provider-location" value={providerLocation} onChange={(event) => setProviderLocation(event.target.value)} placeholder="Location" className={inputClass} />
          <label className="sr-only" htmlFor="training-provider-note">Verification note</label>
          <input id="training-provider-note" value={providerDescription} onChange={(event) => setProviderDescription(event.target.value)} placeholder="Verification note (optional)" className={`${inputClass} sm:col-span-2`} />
        </div>
        <button type="button" disabled={savingAction !== null} onClick={() => { void addProvider(); }} className="mt-4 min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60">{savingAction === "provider" ? "Adding…" : "Add provider"}</button>
      </div>
      <div className={panelClass}>
        <h2 className="text-xl font-semibold">Add a training program</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="sr-only" htmlFor="training-program-provider">Program provider</label>
          <select id="training-program-provider" value={programProviderId} onChange={(event) => setProgramProviderId(event.target.value)} className={inputClass}><option value="" disabled>Select provider</option>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select>
          <label className="sr-only" htmlFor="training-program-name">Program name</label>
          <input id="training-program-name" value={programName} onChange={(event) => setProgramName(event.target.value)} placeholder="Program name" className={inputClass} />
          <label className="sr-only" htmlFor="training-program-duration">Program duration</label>
          <input id="training-program-duration" value={programDuration} onChange={(event) => setProgramDuration(event.target.value)} placeholder="Duration (optional)" className={inputClass} />
          <label className="sr-only" htmlFor="training-program-url">Enrollment URL</label>
          <input id="training-program-url" value={programUrl} onChange={(event) => setProgramUrl(event.target.value)} placeholder="Enrollment URL (optional)" className={inputClass} />
        </div>
        <button type="button" disabled={!programProviderId || savingAction !== null} onClick={() => { void addProgram(); }} className="mt-4 min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-wait disabled:opacity-50">{savingAction === "program" ? "Adding…" : "Add program"}</button>
      </div>
      <div className={panelClass}>
        <h2 className="text-xl font-semibold">Map a program outcome</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Link a program to a qualification so it shows up in applicant pathways.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="training-outcome-program">Training program</label>
          <select id="training-outcome-program" value={outcomeProgramId} onChange={(event) => setOutcomeProgramId(event.target.value)} className={`${inputClass} flex-1`}><option value="" disabled>Select program</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select>
          <label className="sr-only" htmlFor="training-outcome-qualification">Qualification</label>
          <select id="training-outcome-qualification" value={outcomeQualificationId} onChange={(event) => setOutcomeQualificationId(event.target.value)} className={`${inputClass} flex-1`}><option value="" disabled>Select qualification</option>{qualifications.map((qualification) => <option key={qualification.id} value={qualification.id}>{qualification.name}</option>)}</select>
          <button type="button" disabled={!outcomeProgramId || !outcomeQualificationId || savingAction !== null} onClick={() => { void addOutcome(); }} className="min-h-11 rounded-md border border-accent px-4 text-sm font-semibold text-accent hover:bg-surface-muted disabled:cursor-wait disabled:opacity-50">{savingAction === "outcome" ? "Mapping…" : "Map outcome"}</button>
        </div>
      </div>
      {message ? <p className="text-sm text-muted" role="status">{message}</p> : null}
      {programs.length === 0 ? <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">No training programs have been mapped yet.</div> : (
        <ul className="space-y-3" aria-label="Training programs">
          {programs.map((program) => {
            const provider = providers.find((item) => item.id === program.provider_id);
            const programOutcomes = outcomes.filter((outcome) => outcome.training_program_id === program.id);
            return (
              <li key={program.id} className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{program.name}</p>
                    <p className="mt-1 text-sm text-muted">{provider?.name ?? "Provider to be confirmed"} · {provider?.location ?? "Guyana"}{program.duration_text ? ` · ${program.duration_text}` : ""}</p>
                    <p className="mt-2 text-sm text-muted">Outcomes: {programOutcomes.map((outcome) => qualifications.find((qualification) => qualification.id === outcome.qualification_id)?.name).filter((name): name is string => Boolean(name)).join(", ") || "Not mapped yet"}</p>
                  </div>
                  {provider ? <button type="button" disabled={savingAction !== null} onClick={() => { void toggle(provider); }} aria-pressed={provider.is_verified} className={`min-h-11 shrink-0 rounded-md px-4 text-sm font-semibold disabled:cursor-wait disabled:opacity-60 ${provider.is_verified ? "bg-accent text-white hover:bg-accent-strong" : "border border-accent text-accent hover:bg-surface-muted"}`}>{savingAction === `provider:${provider.id}` ? "Updating…" : provider.is_verified ? "Verified" : "Mark verified"}</button> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
