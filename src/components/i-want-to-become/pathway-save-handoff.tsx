"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { saveApplicantPathwayPlan } from "@/lib/i-want-to-become/pathway-actions";
import {
  clearSavedPathwayBrowserState,
  pathwaySaveReturnPath,
  readPendingPathwayPlan,
} from "@/lib/i-want-to-become/pathway-handoff";
import type { PathwayPlanDraft, PathwaySaveViewer } from "@/lib/i-want-to-become/pathway-plan";

type HandoffState =
  | { status: "saving" }
  | { status: "error"; message: string; draft: PathwayPlanDraft | null };

export function PathwaySaveHandoff({ viewer }: { viewer: PathwaySaveViewer }) {
  const router = useRouter();
  const started = useRef(false);
  const [state, setState] = useState<HandoffState>({ status: "saving" });

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let cancelled = false;
    void Promise.resolve().then(async () => {
      const draft = readPendingPathwayPlan(window.localStorage);
      if (!draft) {
        if (!cancelled) setState({ status: "error", message: "We could not find a current route in this browser. Build the route again to save it.", draft: null });
        return;
      }
      if (viewer === "anonymous") {
        if (!cancelled) setState({ status: "error", message: "Sign in to finish saving this route.", draft });
        return;
      }
      if (viewer === "other") {
        if (!cancelled) setState({ status: "error", message: "Career routes can only be saved to an applicant account.", draft });
        return;
      }

      const result = await saveApplicantPathwayPlan(draft);
      if (cancelled) return;
      if (result.error) {
        setState({ status: "error", message: result.error, draft });
        return;
      }
      clearSavedPathwayBrowserState(window.localStorage, window.sessionStorage, draft);
      router.replace("/dashboard?pathway=saved");
      router.refresh();
    });
    return () => {
      cancelled = true;
    };
  }, [router, viewer]);

  function retry(draft: PathwayPlanDraft) {
    setState({ status: "saving" });
    void saveApplicantPathwayPlan(draft).then((result) => {
      if (result.error) {
        setState({ status: "error", message: result.error, draft });
        return;
      }
      clearSavedPathwayBrowserState(window.localStorage, window.sessionStorage, draft);
      router.replace("/dashboard?pathway=saved");
      router.refresh();
    });
  }

  const retryDraft = state.status === "error" ? state.draft : null;

  return (
    <section className="mb-6 rounded-lg border border-border bg-surface p-5" aria-live="polite">
      <h2 className="text-lg font-semibold text-foreground">Saving your career route</h2>
      {state.status === "saving" ? <p className="mt-2 text-sm text-muted">Adding your private planning draft to your dashboard…</p> : (
        <div>
          <p className="mt-2 text-sm leading-6 text-danger" role="alert">{state.message}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {viewer === "anonymous" ? <Link href={`/login?next=${encodeURIComponent(pathwaySaveReturnPath)}`} className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-semibold text-white">Sign in and save</Link> : null}
            {viewer === "applicant" && retryDraft ? <button type="button" onClick={() => retry(retryDraft)} className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-semibold text-white">Try saving again</button> : null}
            <Link href="/i-want-to-become" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-foreground">Build the route again</Link>
          </div>
        </div>
      )}
    </section>
  );
}
