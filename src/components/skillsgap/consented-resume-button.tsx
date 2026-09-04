"use client";

import { useState } from "react";

import { getConsentedCandidateResumeUrl } from "@/lib/skillsgap/actions";

export function ConsentedResumeButton({ applicantId, roleId }: { applicantId: string; roleId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openResume() {
    setLoading(true);
    setError(null);
    const result = await getConsentedCandidateResumeUrl(applicantId, roleId);
    setLoading(false);
    if (result.error || !result.url) {
      setError(result.error ?? "The CV link is unavailable.");
      return;
    }
    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div>
      <button type="button" onClick={() => { void openResume(); }} disabled={loading} className="min-h-10 border border-accent px-3 text-sm font-semibold text-accent hover:bg-teal-50 disabled:cursor-wait disabled:opacity-60">
        {loading ? "Preparing CV…" : "Open consented CV"}
      </button>
      {error ? <p className="mt-2 text-xs text-danger" role="alert">{error}</p> : null}
    </div>
  );
}
