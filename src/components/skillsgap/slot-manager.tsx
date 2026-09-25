"use client";

import { useState } from "react";

import { addInterviewSlot, createJobFair, openJobFair } from "@/lib/skillsgap/actions";
import { formatGuyanaDateTime, formatGuyanaTime } from "@/lib/guyana-time";
import type { Tables } from "@/lib/supabase/database.types";

const inputClass = "min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-accent";
type SavingAction = "create-fair" | `add-slot:${string}` | `toggle:${string}` | null;

export function SlotManager({ initialFairs, initialSlots }: { initialFairs: Tables<"job_fairs">[]; initialSlots: Tables<"interview_slots">[] }) {
  const [fairs, setFairs] = useState(initialFairs);
  const [slots, setSlots] = useState(initialSlots);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("Georgetown");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [savingAction, setSavingAction] = useState<SavingAction>(null);

  async function createFair() {
    if (savingAction) return;
    setSavingAction("create-fair");
    setMessage(null);
    try {
      const result = await createJobFair(name, location, startsAt, endsAt);
      if (result.error) { setMessage(result.error); return; }
      if (result.fair) setFairs((current) => [result.fair as Tables<"job_fairs">, ...current]);
      setName("");
      setMessage("Job fair created as a draft.");
    } catch {
      setMessage("We could not create that job fair. Check your connection and try again.");
    } finally {
      setSavingAction(null);
    }
  }

  async function addSlot(fairId: string) {
    if (savingAction) return;
    setSavingAction(`add-slot:${fairId}`);
    setMessage(null);
    try {
      const result = await addInterviewSlot(fairId, startsAt);
      if (result.error) { setMessage(result.error); return; }
      if (result.slot) setSlots((current) => [...current, result.slot as Tables<"interview_slots">]);
      setMessage("15-minute slot added.");
    } catch {
      setMessage("We could not add that slot. Check your connection and try again.");
    } finally {
      setSavingAction(null);
    }
  }

  async function toggleFair(fair: Tables<"job_fairs">) {
    if (savingAction) return;
    const next = fair.status === "open" ? "closed" : "open";
    setSavingAction(`toggle:${fair.id}`);
    setMessage(null);
    try {
      const result = await openJobFair(fair.id, next);
      if (result.error) { setMessage(result.error); return; }
      setFairs((current) => current.map((item) => item.id === fair.id ? { ...item, status: next } : item));
      setMessage(next === "open" ? "Fair opened for booking." : "Fair closed to new bookings.");
    } catch (thrown) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[pdbg] slot-manager.tsx: updating the job fair failed", thrown);
      }
      setMessage("We could not update that job fair. Check your connection and try again.");
    } finally {
      setSavingAction(null);
    }
  }

  return (
    <section className="mt-6 space-y-6" aria-label="Job fairs and slots">
      <div className="rounded-lg border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Plan a job fair</h2>
        <p className="mt-2 text-sm text-muted">All times are Guyana time (GYT).</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Job fair name" aria-label="Job fair name" className={inputClass} />
          <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Location" aria-label="Location" className={inputClass} />
          <label className="text-sm font-semibold text-foreground">Starts<input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className={`${inputClass} mt-2`} /></label>
          <label className="text-sm font-semibold text-foreground">Ends<input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className={`${inputClass} mt-2`} /></label>
        </div>
        <button type="button" onClick={() => { void createFair(); }} disabled={savingAction !== null} aria-busy={savingAction === "create-fair"} className="mt-4 min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60">{savingAction === "create-fair" ? "Creating…" : "Create fair"}</button>
        {message ? <p className="mt-3 text-sm text-muted" role="status">{message}</p> : null}
      </div>
      {fairs.length === 0 ? <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">No job fairs yet. Plan the first one above.</div> : fairs.map((fair) => (
        <article key={fair.id} className="rounded-lg border border-border bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-muted">{fair.location} · {fair.status === "open" ? "Open for booking" : "Draft"}</p>
              <h2 className="mt-2 text-xl font-semibold">{fair.name}</h2>
              <p className="mt-1 text-sm text-muted">{formatGuyanaDateTime(fair.starts_at)} GYT</p>
            </div>
            <button type="button" onClick={() => { void toggleFair(fair); }} disabled={savingAction !== null} aria-busy={savingAction === `toggle:${fair.id}`} aria-pressed={fair.status === "open"} className={`min-h-11 rounded-md px-4 text-sm font-semibold disabled:cursor-wait disabled:opacity-60 ${fair.status === "open" ? "bg-accent text-white hover:bg-accent-strong" : "border border-accent text-accent hover:bg-surface-muted"}`}>{savingAction === `toggle:${fair.id}` ? "Updating…" : fair.status === "open" ? "Close fair" : "Open fair"}</button>
          </div>
          {slots.filter((slot) => slot.job_fair_id === fair.id).length === 0 ? (
            <p className="mt-5 text-sm text-muted">No slots yet. Add the first 15-minute slot below.</p>
          ) : (
            <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label={`${fair.name} slots`}>
              {slots.filter((slot) => slot.job_fair_id === fair.id).map((slot) => (
                <li key={slot.id} className="rounded-md border border-border bg-surface-muted px-3 py-3 text-center text-sm font-semibold">{formatGuyanaTime(slot.starts_at)}<span className="block text-xs font-normal text-muted">15 min</span></li>
              ))}
            </ul>
          )}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-sm font-semibold">New slot time <span className="font-normal text-muted">(GYT)</span><input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className={`${inputClass} mt-2`} /></label>
            <button type="button" onClick={() => { void addSlot(fair.id); }} disabled={savingAction !== null} aria-busy={savingAction === `add-slot:${fair.id}`} className="min-h-11 rounded-md border border-accent px-4 text-sm font-semibold text-accent hover:bg-surface-muted disabled:cursor-wait disabled:opacity-60">{savingAction === `add-slot:${fair.id}` ? "Adding…" : "Add 15-minute slot"}</button>
          </div>
        </article>
      ))}
    </section>
  );
}
