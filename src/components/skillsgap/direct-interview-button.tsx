"use client";

import { useState } from "react";

import { cancelDirectInterview, initiateDirectInterview } from "@/lib/skillsgap/actions";

export function DirectInterviewButton({ applicantId, roleId, initialInvitationId }: { applicantId: string; roleId: string; initialInvitationId?: string }) {
  const [invitationId, setInvitationId] = useState(initialInvitationId ?? null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (saving) return;
    if (invitationId && !window.confirm("Cancel this interview invitation?")) return;
    setSaving(true);
    setMessage(null);
    try {
      if (invitationId) {
        const result = await cancelDirectInterview(invitationId);
        if (result.error) {
          setMessage(result.error);
          return;
        }
        setInvitationId(null);
        setMessage(result.message ?? "Interview invitation cancelled.");
        return;
      }

      const result = await initiateDirectInterview(applicantId, roleId);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setInvitationId(result.invitationId ?? null);
      setMessage(result.message ?? "Interview invitation sent.");
    } catch {
      setMessage("We couldn’t update the interview invitation. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {invitationId ? <span className="inline-flex items-center rounded-md border border-accent px-2.5 py-1 text-xs font-semibold text-accent">Interview invited</span> : <button type="button" disabled={saving} onClick={() => { void submit(); }} aria-busy={saving} className="min-h-11 rounded-md border border-accent px-4 text-sm font-semibold text-accent hover:bg-surface-muted disabled:cursor-wait disabled:opacity-60">{saving ? "Sending…" : "Invite to interview"}</button>}
      {invitationId ? <button type="button" disabled={saving} onClick={() => { void submit(); }} aria-busy={saving} className="inline-flex min-h-11 items-center text-sm font-semibold text-danger underline-offset-4 hover:underline disabled:cursor-wait disabled:opacity-60">{saving ? "Cancelling…" : "Cancel invitation"}</button> : null}
      {message ? <span className="text-xs text-muted" role="status">{message}</span> : null}
    </div>
  );
}
