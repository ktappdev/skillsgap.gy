"use client";

import { useState } from "react";

import { addInterviewSlot, createJobFair, openJobFair } from "@/lib/skillsgap/actions";
import { formatGuyanaDateTime, formatGuyanaTime } from "@/lib/guyana-time";
import type { Tables } from "@/lib/supabase/database.types";

export function SlotManager({ initialFairs, initialSlots }: { initialFairs: Tables<"job_fairs">[]; initialSlots: Tables<"interview_slots">[] }) {
  const [fairs, setFairs] = useState(initialFairs);
  const [slots, setSlots] = useState(initialSlots);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("Georgetown");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function createFair() {
    const result = await createJobFair(name, location, startsAt, endsAt);
    if (result.error) { setMessage(result.error); return; }
    if (result.fair) setFairs((current) => [result.fair as Tables<"job_fairs">, ...current]);
    setName("");
    setMessage("Job fair created as a draft.");
  }

  async function addSlot(fairId: string) {
    const result = await addInterviewSlot(fairId, startsAt);
    if (result.error) { setMessage(result.error); return; }
    if (result.slot) setSlots((current) => [...current, result.slot as Tables<"interview_slots">]);
    setMessage("15-minute slot added.");
  }

  async function toggleFair(fair: Tables<"job_fairs">) {
    const next = fair.status === "open" ? "closed" : "open";
    const result = await openJobFair(fair.id, next);
    if (result.error) { setMessage(result.error); return; }
    setFairs((current) => current.map((item) => item.id === fair.id ? { ...item, status: next } : item));
  }

  return <section className="mt-8 space-y-5"><div className="border border-border bg-surface p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Small win</p><h2 className="mt-2 text-xl font-semibold">Set the next interview moment</h2><p className="mt-2 text-sm text-muted">All times are Guyana time (GYT).</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Job fair name" aria-label="Job fair name" className="min-h-11 border border-border px-3 text-sm outline-none focus:border-accent" /><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Location" aria-label="Location" className="min-h-11 border border-border px-3 text-sm outline-none focus:border-accent" /><label className="text-xs font-semibold text-muted">Starts<input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="mt-1 min-h-11 w-full border border-border px-3 text-sm text-foreground" /></label><label className="text-xs font-semibold text-muted">Ends<input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className="mt-1 min-h-11 w-full border border-border px-3 text-sm text-foreground" /></label></div><button type="button" onClick={() => { void createFair(); }} className="mt-4 min-h-11 bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong">Create fair</button>{message ? <p className="mt-3 text-sm text-muted" role="status">{message}</p> : null}</div>{fairs.length === 0 ? <div className="border border-border bg-surface p-6 text-sm text-muted">No job fairs yet.</div> : fairs.map((fair) => <article key={fair.id} className="border border-border bg-surface p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">{fair.location}</p><h2 className="mt-2 text-xl font-semibold">{fair.name}</h2><p className="mt-1 text-sm text-muted">{formatGuyanaDateTime(fair.starts_at)} GYT</p></div><button type="button" onClick={() => { void toggleFair(fair); }} className={`min-h-10 px-4 text-sm font-semibold ${fair.status === "open" ? "bg-accent text-white" : "border border-accent text-accent"}`}>{fair.status === "open" ? "Close fair" : "Open fair"}</button></div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{slots.filter((slot) => slot.job_fair_id === fair.id).map((slot) => <span key={slot.id} className="border border-border bg-surface-muted px-3 py-3 text-center text-sm font-semibold">{formatGuyanaTime(slot.starts_at)}<span className="block text-xs font-normal text-muted">15 min</span></span>)}</div><div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"><label className="flex-1 text-sm font-semibold">New slot time <span className="font-normal text-muted">(GYT)</span><input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="mt-2 min-h-11 w-full border border-border px-3 text-sm" /></label><button type="button" onClick={() => { void addSlot(fair.id); }} className="min-h-11 border border-accent px-4 text-sm font-semibold text-accent hover:bg-teal-50">Add 15-minute slot</button></div></article>)}</section>;
}
