"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useToast } from "@/components/ui/toast";
import { clearApplicantPathway } from "@/lib/skillsgap/actions";

type ClearPathwayButtonProps = {
  label?: string;
  confirmMessage?: string;
  onCleared?: () => void | Promise<void>;
};

export function ClearPathwayButton({ label = "Clear all data", confirmMessage, onCleared }: ClearPathwayButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function clearPathway() {
    if (!window.confirm(confirmMessage ?? "Clear your uploaded CV and all pathway data? This cannot be undone. Your account will stay active.")) return;

    setError(null);
    startTransition(async () => {
      try {
        const result = await clearApplicantPathway();
        if (result.error) {
          setError(result.error);
          return;
        }

        // Success removes the CV, so the parent stops rendering this button —
        // and any message inside it — before it could be read. The confirmation
        // goes to the toast region in the root layout, which outlives this
        // subtree. Failure keeps this button mounted, so it stays inline below
        // next to the control the user needs to retry.
        toast("Your CV and pathway data were cleared.", {
          tone: "success",
          description: "Your account stays active. Upload a CV to start a new pathway at any time.",
        });

        await onCleared?.();
        router.refresh();
      } catch (thrown) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[pdbg] clear-pathway-button.tsx: clearing the pathway failed", thrown);
        }
        setError("We could not clear your pathway. Please try again.");
      }
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
      {error ? <p className="max-w-xs text-left text-xs leading-5 text-danger sm:text-right" role="alert">{error}</p> : null}
    </div>
  );
}
