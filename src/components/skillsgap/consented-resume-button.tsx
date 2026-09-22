"use client";

import { useState } from "react";

import { getConsentedCandidateResumeUrl } from "@/lib/skillsgap/actions";

export function ConsentedResumeButton({ applicantId, roleId }: { applicantId: string; roleId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openResume() {
    setLoading(true);
    setError(null);
    try {
      const result = await getConsentedCandidateResumeUrl(applicantId, roleId);
      if (result.error || !result.url) {
        setError(result.error ?? "The CV link is unavailable.");
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch {
      setError("The CV link is unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={() => { void openResume(); }} disabled={loading} aria-busy={loading} className="min-h-11 rounded-md border border-accent px-4 text-sm font-semibold text-accent hover:bg-surface-muted disabled:cursor-wait disabled:opacity-60">
        {loading ? "Preparing CV…" : "Open consented CV"}
      </button>
      {error ? <p className="mt-2 text-xs text-danger" role="alert">{error}</p> : null}
    </div>
  );
}
