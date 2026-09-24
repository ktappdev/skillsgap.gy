"use client";

import { useState } from "react";
import Link from "next/link";

import { revokeProfileShare, shareProfileForRole } from "@/lib/skillsgap/actions";

function getPrivacyDescription(shared: boolean, hasResume: boolean, hasContactEmail: boolean) {
  const contactDetails = hasContactEmail
    ? "your name, phone number, and contact email"
    : "your name and phone number";

  if (shared) {
    return hasResume
      ? `This approved company can see ${contactDetails} and open your CV for this role. Your sign-in email stays private. You can revoke access at any time.`
      : `This approved company can see ${contactDetails} for this role. Your sign-in email stays private. You can revoke access at any time.`;
  }

  return hasResume
    ? `Share ${contactDetails} with this approved company and let them open your CV for this role. Your sign-in email stays private. You can revoke access later. Applying alone keeps your identity private.`
    : `Share ${contactDetails} with this approved company for this role. Your sign-in email stays private. You can revoke access later. Applying alone keeps your identity private.`;
}

export function ShareProfileButton({ roleId, alreadyShared, hasResume, hasContactEmail = false }: { roleId?: string; alreadyShared?: boolean; hasResume: boolean; hasContactEmail?: boolean }) {
  const [shared, setShared] = useState(Boolean(alreadyShared));
  const [message, setMessage] = useState<string | null>(null);
  const [requiresContactDetails, setRequiresContactDetails] = useState(false);
  const [saving, setSaving] = useState(false);

  async function share() {
    if (!roleId) return;
    setSaving(true);
    setMessage(null);
    setRequiresContactDetails(false);
    try {
      const result = await shareProfileForRole(roleId);
      if (result.error) {
        setMessage(result.error);
        setRequiresContactDetails(result.requiresContactDetails === true);
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
    setRequiresContactDetails(false);
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
    <section className="rounded-lg border border-border bg-surface-muted p-5" aria-live="polite">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Privacy choice</p>
      <h2 className="mt-2 text-lg font-semibold">{shared ? "Your profile is shared privately for this role" : "Ready to be considered?"}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{getPrivacyDescription(shared, hasResume, hasContactEmail)}</p>
      {shared ? <button type="button" disabled={saving} onClick={() => { void revoke(); }} className="mt-4 min-h-11 rounded-md px-1 text-sm font-semibold text-danger underline-offset-4 transition-colors hover:bg-red-50 hover:underline disabled:cursor-wait disabled:opacity-60">{saving ? "Updating…" : "Revoke private sharing"}</button> : <button type="button" disabled={saving} onClick={() => { void share(); }} className="mt-4 min-h-11 rounded-md border border-accent px-4 text-sm font-semibold text-accent transition-colors hover:bg-teal-50 disabled:cursor-wait disabled:opacity-60">{saving ? "Sharing privately…" : "Share profile privately"}</button>}
      {message ? <p className="mt-3 text-sm text-muted" role="status">{message}</p> : null}
      {requiresContactDetails ? <Link href="/dashboard?editContact=1#contact-details" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline">Add contact details →</Link> : null}
    </section>
  );
}
