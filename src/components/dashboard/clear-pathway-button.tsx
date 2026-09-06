"use client";

import { useState, useTransition } from "react";

import { clearApplicantPathway } from "@/lib/skillsgap/actions";

export function ClearPathwayButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function clearPathway() {
    if (!window.confirm("Clear your uploaded CV and all pathway data? This cannot be undone. Your account will stay active.")) return;

    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await clearApplicantPathway();
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage("Your pathway is clear. Upload a new CV whenever you are ready.");
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={clearPathway}
        disabled={isPending}
        aria-busy={isPending}
        className="min-h-10 border border-danger px-3 text-sm font-semibold text-danger transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
      >
        {isPending ? "Clearing…" : "Clear all data"}
      </button>
      <p className="max-w-xs text-right text-xs leading-5 text-muted" role="status" aria-live="polite">
        {message}
      </p>
      {error ? <p className="max-w-xs text-right text-xs leading-5 text-danger" role="alert">{error}</p> : null}
    </div>
  );
}
