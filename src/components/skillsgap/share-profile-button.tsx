"use client";

import { useState } from "react";

import { revokeProfileShare, shareProfileForRole } from "@/lib/skillsgap/actions";

export function ShareProfileButton({ roleId, alreadyShared }: { roleId?: string; alreadyShared?: boolean }) {
  const [shared, setShared] = useState(Boolean(alreadyShared));
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function share() {
    if (!roleId) return;
    setSaving(true);
    setMessage(null);
    try {
      const result = await shareProfileForRole(roleId);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setShared(true);
      setMessage(result.message ?? "Profile shared for this role.");
    } catch {
      setMessage("We couldn’t share your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function revoke() {
    if (!roleId) return;
    setSaving(true);
    setMessage(null);
    try {
      const result = await revokeProfileShare(roleId);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setShared(false);
      setMessage(result.message ?? "Profile sharing was revoked for this role.");
    } catch {
      setMessage("We couldn’t update profile sharing. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!roleId) return null;
  return (
    <section className="border border-border bg-surface-muted p-5" aria-live="polite">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Privacy choice</p>
      <h2 className="mt-2 text-lg font-semibold">{shared ? "Your profile is shared privately for this role" : "Ready to be considered?"}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{shared ? "This company's approved team can now see your name and contact details for this opportunity. Your consent is limited to this role." : "Share your profile privately with this approved company so they can contact you if your pathway is a fit. You can revoke this later."}</p>
      {shared ? <button type="button" disabled={saving} onClick={() => { void revoke(); }} className="mt-4 text-sm font-semibold text-danger underline-offset-4 hover:underline disabled:opacity-60">{saving ? "Updating…" : "Revoke private sharing"}</button> : <button type="button" disabled={saving} onClick={() => { void share(); }} className="mt-4 min-h-10 border border-accent px-4 text-sm font-semibold text-accent hover:bg-teal-50 disabled:cursor-wait disabled:opacity-60">{saving ? "Sharing privately…" : "Share profile privately"}</button>}
      {message ? <p className="mt-3 text-sm text-muted" role="status">{message}</p> : null}
    </section>
  );
}
