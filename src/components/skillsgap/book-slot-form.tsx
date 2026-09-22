"use client";

import { useState } from "react";

import { bookInterviewSlot } from "@/lib/skillsgap/actions";
import { formatGuyanaDateTime } from "@/lib/guyana-time";
import type { Tables } from "@/lib/supabase/database.types";

export function BookSlotForm({ invitationId, slots }: { invitationId: string; slots: Tables<"interview_slots">[] }) {
  const [slotId, setSlotId] = useState(slots[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!slotId) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const result = await bookInterviewSlot(invitationId, slotId);
      if (result.error) setError(result.error);
      else setMessage(result.message ?? "Interview slot reserved.");
    } catch {
      setError("We couldn’t reserve that slot. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (slots.length === 0) return <p className="text-sm leading-6 text-muted">No open 15-minute slots for this invitation. Check back soon.</p>;
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="flex-1 text-sm font-semibold text-foreground">Choose a 15-minute slot <span className="font-normal text-muted">(GYT)</span><select value={slotId} onChange={(event) => { setSlotId(event.target.value); setMessage(null); setError(null); }} className="mt-2 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal"><option value="" disabled>Select a time</option>{slots.map((slot) => <option key={slot.id} value={slot.id}>{formatGuyanaDateTime(slot.starts_at)} GYT</option>)}</select></label><button type="button" disabled={saving || !slotId} onClick={() => { void submit(); }} aria-busy={saving} className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60">{saving ? "Reserving…" : "Confirm slot"}</button>{error ? <p className="text-sm text-danger" role="alert">{error}</p> : message ? <p className="text-sm text-muted" role="status">{message}</p> : null}</div>;
}
