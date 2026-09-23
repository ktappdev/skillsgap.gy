"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { saveApplicantPathwayPlan } from "@/lib/i-want-to-become/pathway-actions";
import { createPathwayPlanHandoff } from "@/lib/i-want-to-become/pathway-handoff-actions";
import { clearSavedPathwayBrowserState, pathwaySaveReturnPath } from "@/lib/i-want-to-become/pathway-handoff";
import { createPathwayPlanDraft, type PathwayPlanInput, type PathwaySaveViewer } from "@/lib/i-want-to-become/pathway-plan";

type SavePathwayControlProps = {
  plan: PathwayPlanInput;
  viewer: PathwaySaveViewer;
};

export function SavePathwayControl({ plan, viewer }: SavePathwayControlProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function savePathway() {
    setError(null);
    const draft = createPathwayPlanDraft(plan);
    if (viewer === "other") {
      setError("Career routes can only be saved to an applicant account.");
      return;
    }
    if (viewer === "anonymous") {
      startTransition(async () => {
        try {
          const result = await createPathwayPlanHandoff(draft);
          if (result.error || !result.token) {
            setError(result.error ?? "We could not prepare your secure save link. Please try again.");
            return;
          }
          router.push(`/signup?next=${encodeURIComponent(pathwaySaveReturnPath(result.token))}`);
        } catch {
          setError("We could not prepare your secure save link. Please try again.");
        }
      });
      return;
    }

    startTransition(async () => {
      try {
        const result = await saveApplicantPathwayPlan(draft);
        if (result.error) {
          setError(result.error);
          return;
        }
        try {
          clearSavedPathwayBrowserState(window.localStorage, window.sessionStorage, draft);
        } catch {
          // The durable server save must not depend on browser storage availability.
        }
        router.push("/dashboard?pathway=saved");
        router.refresh();
      } catch {
        setError("We couldn’t save this route right now. Please try again.");
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={savePathway}
        disabled={isPending}
        className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60"
      >
        {isPending ? "Saving route…" : viewer === "applicant" ? "Save to my dashboard" : "Create account and save this plan"}
      </button>
      {error ? <p className="mt-3 max-w-xl text-sm leading-6 text-danger" role="alert">{error}</p> : null}
    </div>
  );
}
