"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { respondToDirectInterview } from "@/lib/skillsgap/actions";

type DirectInterviewResponseProps = {
  invitationId: string;
  initialStatus: "invited" | "accepted";
};

type ResponseStatus = DirectInterviewResponseProps["initialStatus"] | "declined";

export function DirectInterviewResponse({ invitationId, initialStatus }: DirectInterviewResponseProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ResponseStatus>(initialStatus);
  const [saving, setSaving] = useState(false);
  // Success and failure are separate states: a decline that saved is a status
  // update, not an alert. Rendering both from one string is what painted a
  // successful "you declined" in danger red.
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function respond(nextStatus: "accepted" | "declined") {
    if (saving) return;
    if (nextStatus === "declined" && !window.confirm("Decline this interview invitation?")) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const result = await respondToDirectInterview(invitationId, nextStatus);
      if (result.error) {
        setError(result.error);
        return;
      }
      setStatus(nextStatus);
      setMessage(result.message ?? "Your response was saved.");
      router.refresh();
    } catch (thrown) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[pdbg] direct-interview-response.tsx: saving the response failed", thrown);
      }
      setError("We could not save your response. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (status === "accepted") {
    return (
      <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm" role="status">
        <p className="font-semibold text-emerald-900">You told the company you are interested.</p>
        <p className="mt-1 leading-6 text-emerald-800">They can follow up with you about the next conversation. Your name and CV remain private unless you share your profile.</p>
        {message ? <p className="mt-2 text-emerald-800" aria-live="polite">{message}</p> : null}
      </div>
    );
  }

  if (status === "declined") {
    return (
      <div className="mt-4 rounded-md border border-border bg-surface-muted px-4 py-3 text-sm" role="status">
        <p className="font-semibold text-foreground">You declined this interview invitation.</p>
        <p className="mt-1 leading-6 text-muted">The company will not expect a reply for this role. Your profile stays as it is, and you can still apply to other positions.</p>
        {message ? <p className="mt-2 text-muted" aria-live="polite">{message}</p> : null}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <p className="text-sm font-semibold text-foreground">Would you like to continue the conversation?</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button type="button" disabled={saving} onClick={() => { void respond("accepted"); }} aria-busy={saving} className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60">
          {saving ? "Saving…" : "I’m interested"}
        </button>
        <button type="button" disabled={saving} onClick={() => { void respond("declined"); }} className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-muted transition-colors hover:border-danger hover:text-danger disabled:cursor-wait disabled:opacity-60">
          Not interested
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-danger" role="alert">{error}</p> : null}
    </div>
  );
}
