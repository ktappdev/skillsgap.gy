"use client";

import { useState } from "react";

import { applyToJob, withdrawApplication } from "@/lib/skillsgap/actions";
import type { ApplicationStatus } from "@/lib/supabase/database.types";

export function ApplyButton({ roleId, initialStatus, eligible, threshold }: { roleId?: string; initialStatus?: ApplicationStatus | null; eligible: boolean; threshold: number }) {
  const [status, setStatus] = useState<ApplicationStatus | null>(initialStatus ?? null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);

  if (!roleId) return null;
  const targetRoleId = roleId;

  const applied = status === "applied";
  const canApply = eligible || applied;

  async function submit() {
    if (!canApply || saving) return;
    setSaving(true);
    setMessage(null);
    const result = applied ? await withdrawApplication(targetRoleId) : await applyToJob(targetRoleId);
    setSaving(false);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setStatus(applied ? "withdrawn" : "applied");
    setConfirmingWithdraw(false);
    setMessage(result.message ?? (applied ? "Your application was withdrawn." : "Application submitted."));
  }

  function handleButtonClick() {
    if (applied && !confirmingWithdraw) {
      setConfirmingWithdraw(true);
      setMessage(null);
      return;
    }
    void submit();
  }

  return (
    <section className="border border-border bg-surface-muted p-5" aria-live="polite">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Application</p>
      <h2 className="mt-2 text-lg font-semibold">{applied ? "Application submitted" : status === "withdrawn" ? "Application withdrawn" : eligible ? "Ready to apply?" : `Application opens at ${threshold}%`}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{applied ? "This company can see that you applied, but your name and CV remain private until you share your profile or confirm a fair-based interview." : eligible ? "Applying tells the company you are interested. It does not share your name or CV, and you can withdraw the application at any time." : `Reach a ${threshold}% match to apply. Keep confirming your qualifications and closing the remaining gaps.`}</p>
      {canApply ? confirmingWithdraw ? <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3" role="alert">
        <p className="text-sm leading-6 text-red-900">Withdraw your application for this role? You can apply again while you still meet the threshold.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={saving} onClick={() => { void submit(); }} className="min-h-11 rounded-md bg-danger px-4 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">{saving ? "Withdrawing…" : "Withdraw application"}</button>
          <button type="button" disabled={saving} onClick={() => setConfirmingWithdraw(false)} className="min-h-11 rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground disabled:opacity-60">Keep application</button>
        </div>
      </div> : <button type="button" disabled={saving} onClick={handleButtonClick} className={`mt-4 min-h-10 px-4 text-sm font-semibold disabled:cursor-wait disabled:opacity-60 ${applied ? "border border-danger text-danger hover:bg-red-50" : "bg-accent text-white hover:bg-accent-strong"}`}>{saving ? "Updating…" : applied ? "Withdraw application" : status === "withdrawn" ? "Apply again" : "Apply to this role"}</button> : null}
      {message ? <p className="mt-3 text-sm text-muted" role="status">{message}</p> : null}
    </section>
  );
}
