"use client";

import { useState } from "react";

import { applyToJob, withdrawApplication } from "@/lib/skillsgap/actions";
import type { ApplicationStatus } from "@/lib/supabase/database.types";

export function ApplyButton({ roleId, initialStatus, eligible }: { roleId?: string; initialStatus?: ApplicationStatus | null; eligible: boolean }) {
  const [status, setStatus] = useState<ApplicationStatus | null>(initialStatus ?? null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
    setMessage(result.message ?? (applied ? "Your application was withdrawn." : "Application submitted."));
  }

  return (
    <section className="border border-border bg-surface-muted p-5" aria-live="polite">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Application</p>
      <h2 className="mt-2 text-lg font-semibold">{applied ? "Application submitted" : status === "withdrawn" ? "Application withdrawn" : eligible ? "Ready to apply?" : "Application opens at 85%"}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{applied ? "This company can see that you applied, but your name and CV remain private until you share your profile or confirm a fair-based interview." : eligible ? "Applying tells the company you are interested. It does not share your name or CV, and you can withdraw the application at any time." : "Reach an 85% match to apply. Keep confirming your qualifications and closing the remaining gaps."}</p>
      {canApply ? <button type="button" disabled={saving} onClick={() => { void submit(); }} className={`mt-4 min-h-10 px-4 text-sm font-semibold disabled:cursor-wait disabled:opacity-60 ${applied ? "border border-danger text-danger hover:bg-red-50" : "bg-accent text-white hover:bg-accent/90"}`}>{saving ? "Updating…" : applied ? "Withdraw application" : status === "withdrawn" ? "Apply again" : "Apply to this role"}</button> : null}
      {message ? <p className="mt-3 text-sm text-muted" role="status">{message}</p> : null}
    </section>
  );
}
