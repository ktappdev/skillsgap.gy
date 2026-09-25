"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type ConnectionState = "connecting" | "live" | "offline";

type RealtimeSyncProps = {
  userId: string;
  isProcessing: boolean;
};

// While work is in flight the pill promises a refresh every five seconds, and
// the polling effect below keeps that promise even when the channel is down.
// That is what makes the offline copy truthful instead of a guess.
const pollingIntervalMs = 5_000;

// Realtime reports SUBSCRIBED, CHANNEL_ERROR, TIMED_OUT, or CLOSED. An attempt
// that reports nothing at all would otherwise strand the pill on "Connecting
// updates" forever with nothing to act on, so a stalled attempt is treated as
// offline once this deadline passes. It is one bounded timer per attempt,
// cleared on unmount, so attempts can never stack up.
const connectDeadlineMs = 8_000;

function debugLog(message: string, details?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") return;
  console.warn(`[pdbg] realtime-sync.tsx: ${message}`, details);
}

export function RealtimeSync({ userId, isProcessing }: RealtimeSyncProps) {
  const router = useRouter();
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [connectionAttempt, setConnectionAttempt] = useState(0);

  // One channel per attempt. Retrying bumps `connectionAttempt`, so React tears
  // the old channel down (removeChannel) before the next attempt subscribes.
  // The topic carries the attempt number as well, because reusing a topic whose
  // removal is still in flight can hand back the stale channel instead of
  // opening a second subscription — and the `tornDown` guard ignores any
  // late status the old channel reports while it closes.
  useEffect(() => {
    const supabase = createClient();
    let tornDown = false;

    const channel = supabase
      .channel(`skillsgap-progress-live-${connectionAttempt}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "processing_jobs", filter: `applicant_id=eq.${userId}` }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "resume_extraction_findings", filter: `applicant_id=eq.${userId}` }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "job_matches", filter: `applicant_id=eq.${userId}` }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "interview_invitations", filter: `applicant_id=eq.${userId}` }, () => router.refresh())
      .subscribe((status) => {
        if (tornDown) return;

        if (status === "SUBSCRIBED") {
          setConnectionState("live");
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          debugLog("live updates stopped", { status, connectionAttempt });
          setConnectionState("offline");
        }
      });

    return () => {
      tornDown = true;
      void supabase.removeChannel(channel);
    };
  }, [connectionAttempt, router, userId]);

  useEffect(() => {
    if (connectionState !== "connecting") return;

    const deadline = window.setTimeout(() => {
      setConnectionState((current) => {
        if (current !== "connecting") return current;
        debugLog("connect attempt went quiet; falling back to polling", { connectionAttempt });
        return "offline";
      });
    }, connectDeadlineMs);

    return () => window.clearTimeout(deadline);
  }, [connectionAttempt, connectionState]);

  useEffect(() => {
    if (!isProcessing) return;

    const refreshInterval = window.setInterval(() => {
      router.refresh();
    }, pollingIntervalMs);

    return () => window.clearInterval(refreshInterval);
  }, [isProcessing, router]);

  const reconnect = () => {
    debugLog("reconnecting live updates", { connectionAttempt });
    setConnectionState("connecting");
    setConnectionAttempt((attempt) => attempt + 1);
  };

  const isLive = connectionState === "live";
  const label = isLive
    ? "Updating automatically"
    : connectionState === "connecting"
      ? "Connecting updates"
      : isProcessing
        ? `Live updates are off — refreshing every ${pollingIntervalMs / 1000} seconds`
        : "Live updates are off — retry or refresh the page";

  return (
    <span className="inline-flex min-h-11 flex-wrap items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted">
      <span className="inline-flex items-center gap-2" role="status" aria-live="polite">
        <span className={`size-2 rounded-full ${isLive ? "bg-emerald-500" : "bg-amber-400"}`} aria-hidden="true" />
        {label}
      </span>
      {connectionState === "offline" ? (
        <button
          type="button"
          onClick={reconnect}
          className="min-h-6 rounded-full border border-border px-2.5 font-semibold text-accent transition hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Retry live updates
        </button>
      ) : null}
    </span>
  );
}
