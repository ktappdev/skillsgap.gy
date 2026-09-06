"use client";

import { useState } from "react";

import { cancelDirectInterview, initiateDirectInterview } from "@/lib/skillsgap/actions";

export function DirectInterviewButton({ applicantId, roleId, initialInvitationId }: { applicantId: string; roleId: string; initialInvitationId?: string }) {
  const [invitationId, setInvitationId] = useState(initialInvitationId ?? null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (saving) return;
    setSaving(true);
    setMessage(null);
    if (invitationId) {
      const result = await cancelDirectInterview(invitationId);
      setSaving(false);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setInvitationId(null);
      setMessage(result.message ?? "Interview invitation cancelled.");
      return;
    }

    const result = await initiateDirectInterview(applicantId, roleId);
    setSaving(false);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setInvitationId(result.invitationId ?? null);
    setMessage(result.message ?? "Interview invitation sent.");
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {invitationId ? <span className="bg-amber-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-amber-800">Interview invited</span> : <button type="button" disabled={saving} onClick={() => { void submit(); }} className="min-h-10 border border-accent px-3 text-sm font-semibold text-accent hover:bg-teal-50 disabled:cursor-wait disabled:opacity-60">{saving ? "Sending…" : "Initiate interview"}</button>}
      {invitationId ? <button type="button" disabled={saving} onClick={() => { void submit(); }} className="text-sm font-semibold text-danger underline-offset-4 hover:underline disabled:cursor-wait disabled:opacity-60">{saving ? "Cancelling…" : "Cancel invitation"}</button> : null}
      {message ? <span className="text-xs text-muted" role="status">{message}</span> : null}
    </div>
  );
}
