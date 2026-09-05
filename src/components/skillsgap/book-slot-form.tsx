"use client";

import { useState } from "react";

import { bookInterviewSlot } from "@/lib/skillsgap/actions";
import { formatGuyanaDateTime } from "@/lib/guyana-time";
import type { Tables } from "@/lib/supabase/database.types";

export function BookSlotForm({ invitationId, slots }: { invitationId: string; slots: Tables<"interview_slots">[] }) {
  const [slotId, setSlotId] = useState(slots[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!slotId) return;
    setSaving(true);
    const result = await bookInterviewSlot(invitationId, slotId);
    setMessage(result.message ?? result.error ?? null);
    setSaving(false);
  }

  if (slots.length === 0) return <p className="text-sm leading-6 text-muted">There are no open 15-minute slots for this invitation. Check back soon.</p>;
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="flex-1 text-sm font-semibold text-foreground">Choose a 15-minute slot <span className="font-normal text-muted">(GYT)</span><select value={slotId} onChange={(event) => setSlotId(event.target.value)} className="mt-2 min-h-11 w-full border border-border bg-surface px-3 text-sm font-normal"><option value="" disabled>Select a time</option>{slots.map((slot) => <option key={slot.id} value={slot.id}>{formatGuyanaDateTime(slot.starts_at)} GYT</option>)}</select></label><button type="button" disabled={saving || !slotId} onClick={() => { void submit(); }} className="min-h-11 bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:cursor-wait disabled:opacity-60">{saving ? "Reserving…" : "Confirm slot"}</button>{message ? <p className="text-sm text-muted" role="status">{message}</p> : null}</div>;
}
