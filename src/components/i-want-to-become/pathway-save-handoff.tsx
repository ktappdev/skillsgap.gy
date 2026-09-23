"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useState, useTransition } from "react";

import { savePathwayPlanFromHandoff } from "@/lib/i-want-to-become/pathway-handoff-actions";
import { clearSavedPathwayBrowserState, isPathwayHandoffToken, pathwaySaveReturnPath } from "@/lib/i-want-to-become/pathway-handoff";
import type { PathwaySaveViewer } from "@/lib/i-want-to-become/pathway-plan";

type HandoffState =
  | { status: "saving" }
  | { status: "error"; message: string; retryable: boolean };

type PathwaySaveHandoffProps = {
  viewer: PathwaySaveViewer;
  token?: string;
};

export function PathwaySaveHandoff({ viewer, token }: PathwaySaveHandoffProps) {
  useLayoutEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("handoff")) return;
    url.searchParams.delete("handoff");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const router = useRouter();
  const [, startTransition] = useTransition();
  const [state, setState] = useState<HandoffState>({ status: "saving" });

  const save = useCallback(async () => {
    if (!token || !isPathwayHandoffToken(token)) {
      setState({ status: "error", message: "This save link is invalid or incomplete. Build the route again to save it.", retryable: false });
      return;
    }
    if (viewer === "anonymous") {
      setState({ status: "error", message: "Sign in to finish saving this route.", retryable: false });
      return;
    }
    if (viewer === "other") {
      setState({ status: "error", message: "Career routes can only be saved to an applicant account. Sign out and reopen this save link with your applicant account.", retryable: false });
      return;
    }

    setState({ status: "saving" });
    try {
      const result = await savePathwayPlanFromHandoff(token);
      if (result.error || !result.completed) {
        setState({ status: "error", message: result.error ?? "We could not save this route. Please try again.", retryable: result.retryable === true });
        return;
      }
      if (result.draft) {
        try {
          clearSavedPathwayBrowserState(window.localStorage, window.sessionStorage, result.draft);
        } catch {
          // The durable server save must not depend on browser storage availability.
        }
      }
      router.replace("/dashboard?pathway=saved");
      router.refresh();
    } catch {
      setState({ status: "error", message: "We could not save this route. Your secure link is still available, so try again.", retryable: true });
    }
  }, [router, token, viewer]);

  useEffect(() => {
    startTransition(async () => {
      await save();
    });
  }, [save, startTransition]);

  return (
    <section className="mb-6 rounded-lg border border-border bg-surface p-5" aria-live="polite">
      <h2 className="text-lg font-semibold text-foreground">Saving your career route</h2>
      {state.status === "saving" ? <p className="mt-2 text-sm text-muted" role="status">Adding your private planning draft to your dashboard…</p> : (
        <div>
          <p className="mt-2 text-sm leading-6 text-danger" role="alert">{state.message}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {viewer === "anonymous" && token && isPathwayHandoffToken(token) ? <Link href={`/login?next=${encodeURIComponent(pathwaySaveReturnPath(token))}`} className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-semibold text-white">Sign in and save</Link> : null}
            {viewer === "applicant" && state.retryable ? <button type="button" onClick={() => { startTransition(async () => { await save(); }); }} className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-semibold text-white">Try saving again</button> : null}
            <Link href="/i-want-to-become" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-foreground">Build the route again</Link>
          </div>
        </div>
      )}
    </section>
  );
}
