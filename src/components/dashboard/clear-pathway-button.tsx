"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { clearApplicantPathway } from "@/lib/skillsgap/actions";

type ClearPathwayButtonProps = {
  label?: string;
  confirmMessage?: string;
  onCleared?: () => void | Promise<void>;
};

export function ClearPathwayButton({ label = "Clear all data", confirmMessage, onCleared }: ClearPathwayButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function clearPathway() {
    if (!window.confirm(confirmMessage ?? "Clear your uploaded CV and all pathway data? This cannot be undone. Your account will stay active.")) return;

    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await clearApplicantPathway();
      if (result.error) {
        setError(result.error);
        return;
      }
      await onCleared?.();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <button
        type="button"
        onClick={clearPathway}
        disabled={isPending}
        aria-busy={isPending}
        className="min-h-11 w-full rounded-md border border-danger px-3 text-sm font-semibold text-danger transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
      >
        {isPending ? "Clearing…" : label}
      </button>
      <p className="max-w-xs text-left text-xs leading-5 text-muted sm:text-right" role="status" aria-live="polite">
        {message}
      </p>
      {error ? <p className="max-w-xs text-left text-xs leading-5 text-danger sm:text-right" role="alert">{error}</p> : null}
    </div>
  );
}
