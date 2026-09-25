"use client";

import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cancelDirectInterview, initiateDirectInterview } from "@/lib/skillsgap/actions";

type DirectInvitationStatus = "invited" | "accepted" | "declined";

export function DirectInterviewButton({ applicantId, roleId, initialInvitationId, initialInvitationStatus = "invited" }: { applicantId: string; roleId: string; initialInvitationId?: string; initialInvitationStatus?: DirectInvitationStatus }) {
  const [invitationId, setInvitationId] = useState(initialInvitationId ?? null);
  const [invitationStatus, setInvitationStatus] = useState<DirectInvitationStatus>(initialInvitationStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [cancelRequested, setCancelRequested] = useState(false);

  async function invite() {
    if (saving) return;
    setSaving(true);
    setMessage(null);
    try {
      const result = await initiateDirectInterview(applicantId, roleId);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setInvitationId(result.invitationId ?? null);
      setInvitationStatus("invited");
      setMessage(result.message ?? "Interview invitation sent.");
    } catch {
      setMessage("We couldn’t update the interview invitation. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function cancelInvitation() {
    if (saving || !invitationId) return;
    setSaving(true);
    setMessage(null);
    try {
      const result = await cancelDirectInterview(invitationId);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setInvitationId(null);
      setMessage(result.message ?? "Interview invitation cancelled.");
    } catch {
      setMessage("We couldn’t update the interview invitation. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {invitationId ? <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${invitationStatus === "accepted" ? "border-accent text-accent" : invitationStatus === "declined" ? "border-amber-300 text-amber-800" : "border-accent text-accent"}`}>{invitationStatus === "accepted" ? "Applicant interested" : invitationStatus === "declined" ? "Applicant declined" : "Interview invited"}</span> : <button type="button" disabled={saving} onClick={() => { void invite(); }} aria-busy={saving} className="min-h-11 rounded-md border border-accent px-4 text-sm font-semibold text-accent transition-colors hover:bg-surface-muted disabled:cursor-wait disabled:opacity-60">{saving ? "Sending…" : "Invite to interview"}</button>}
      {invitationId && invitationStatus === "invited" ? <button type="button" disabled={saving} onClick={() => setCancelRequested(true)} aria-busy={saving} className="inline-flex min-h-11 items-center text-sm font-semibold text-danger underline-offset-4 hover:underline disabled:cursor-wait disabled:opacity-60">{saving ? "Cancelling…" : "Cancel invitation"}</button> : null}
      {message ? <span className="text-xs text-muted" role="status">{message}</span> : null}
      <ConfirmDialog
        open={cancelRequested}
        title="Cancel this interview invitation?"
        description="The invitation is withdrawn and the applicant can no longer respond to it. You can send a new invitation at any time."
        confirmLabel="Cancel the invitation"
        cancelLabel="Keep the invitation"
        busyLabel="Cancelling…"
        destructive
        onConfirm={async () => {
          await cancelInvitation();
          setCancelRequested(false);
        }}
        onCancel={() => setCancelRequested(false)}
      />
    </div>
  );
}
