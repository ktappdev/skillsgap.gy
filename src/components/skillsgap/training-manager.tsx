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

  async function addProvider() {
    const result = await createTrainingProvider(providerName, providerLocation, providerDescription);
    if (result.error) { setMessage(result.error); return; }
    if (result.provider) { setProviders((current) => [...current, result.provider!]); setProgramProviderId(result.provider.id); }
    setProviderName(""); setProviderDescription(""); setMessage("Provider added. Verify it before recommending its programs.");
  }

  async function addProgram() {
    const result = await createTrainingProgram(programProviderId, programName, programDuration, programUrl);
    if (result.error) { setMessage(result.error); return; }
    if (result.program) { setPrograms((current) => [...current, result.program!]); setOutcomeProgramId(result.program.id); }
    setProgramName(""); setProgramDuration(""); setProgramUrl(""); setMessage("Program added. Map the qualification it delivers.");
  }

  async function addOutcome() {
    const result = await mapTrainingOutcome(outcomeProgramId, outcomeQualificationId);
    if (result.error) { setMessage(result.error); return; }
    if (!outcomes.some((outcome) => outcome.training_program_id === outcomeProgramId && outcome.qualification_id === outcomeQualificationId)) {
      setOutcomes((current) => [...current, { training_program_id: outcomeProgramId, qualification_id: outcomeQualificationId, created_at: new Date().toISOString() }]);
    }
    setMessage("Program outcome mapped to the qualification taxonomy.");
  }

  async function toggle(provider: Tables<"training_providers">) {
    const result = await setTrainingProviderVerified(provider.id, !provider.is_verified);
    if (result.error) { setMessage(result.error); return; }
    setProviders((current) => current.map((item) => item.id === provider.id ? { ...item, is_verified: !item.is_verified } : item));
    setMessage(provider.is_verified ? "Provider marked as not verified." : "Provider verified and eligible for recommendations.");
  }

  return <section className="mt-8 space-y-5">
    <div className="border border-border bg-surface p-5 shadow-sm"><h2 className="text-lg font-semibold">Add a local provider</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><input value={providerName} onChange={(event) => setProviderName(event.target.value)} placeholder="Provider name" className="min-h-11 border border-border px-3 text-sm" /><input value={providerLocation} onChange={(event) => setProviderLocation(event.target.value)} placeholder="Location" className="min-h-11 border border-border px-3 text-sm" /><input value={providerDescription} onChange={(event) => setProviderDescription(event.target.value)} placeholder="Verification note (optional)" className="min-h-11 border border-border px-3 text-sm sm:col-span-2" /></div><button type="button" onClick={() => { void addProvider(); }} className="mt-4 min-h-11 bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong">Add provider</button></div>
    <div className="border border-border bg-surface p-5 shadow-sm"><h2 className="text-lg font-semibold">Add a training program</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><select value={programProviderId} onChange={(event) => setProgramProviderId(event.target.value)} className="min-h-11 border border-border bg-surface px-3 text-sm"><option value="" disabled>Select provider</option>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select><input value={programName} onChange={(event) => setProgramName(event.target.value)} placeholder="Program name" className="min-h-11 border border-border px-3 text-sm" /><input value={programDuration} onChange={(event) => setProgramDuration(event.target.value)} placeholder="Duration (optional)" className="min-h-11 border border-border px-3 text-sm" /><input value={programUrl} onChange={(event) => setProgramUrl(event.target.value)} placeholder="Enrollment URL (optional)" className="min-h-11 border border-border px-3 text-sm" /></div><button type="button" disabled={!programProviderId} onClick={() => { void addProgram(); }} className="mt-4 min-h-11 bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong disabled:opacity-50">Add program</button></div>
    <div className="border border-border bg-surface p-5 shadow-sm"><h2 className="text-lg font-semibold">Map a program outcome</h2><div className="mt-4 flex flex-col gap-3 sm:flex-row"><select value={outcomeProgramId} onChange={(event) => setOutcomeProgramId(event.target.value)} className="min-h-11 flex-1 border border-border bg-surface px-3 text-sm"><option value="" disabled>Select program</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select><select value={outcomeQualificationId} onChange={(event) => setOutcomeQualificationId(event.target.value)} className="min-h-11 flex-1 border border-border bg-surface px-3 text-sm"><option value="" disabled>Select qualification</option>{qualifications.map((qualification) => <option key={qualification.id} value={qualification.id}>{qualification.name}</option>)}</select><button type="button" disabled={!outcomeProgramId || !outcomeQualificationId} onClick={() => { void addOutcome(); }} className="min-h-11 border border-accent px-4 text-sm font-semibold text-accent hover:bg-teal-50 disabled:opacity-50">Map outcome</button></div></div>
    {message ? <p className="text-sm text-muted" role="status">{message}</p> : null}
    {programs.length === 0 ? <div className="border border-border bg-surface p-6 text-sm text-muted">No training programs have been mapped yet.</div> : programs.map((program) => { const provider = providers.find((item) => item.id === program.provider_id); const programOutcomes = outcomes.filter((outcome) => outcome.training_program_id === program.id); return <article key={program.id} className="flex flex-col gap-4 border border-border bg-surface p-5 shadow-sm"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="font-semibold text-foreground">{program.name}</p><p className="mt-1 text-sm text-muted">{provider?.name ?? "Provider to be confirmed"} · {provider?.location ?? "Guyana"}{program.duration_text ? ` · ${program.duration_text}` : ""}</p><p className="mt-2 text-xs text-muted">Outcomes: {programOutcomes.map((outcome) => qualifications.find((qualification) => qualification.id === outcome.qualification_id)?.name).filter((name): name is string => Boolean(name)).join(", ") || "Not mapped yet"}</p></div>{provider ? <button type="button" onClick={() => { void toggle(provider); }} className={`min-h-10 px-3 text-sm font-semibold ${provider.is_verified ? "bg-emerald-700 text-white" : "border border-accent text-accent hover:bg-teal-50"}`}>{provider.is_verified ? "Verified" : "Mark provider verified"}</button> : null}</div></article>; })}
  </section>;
}
