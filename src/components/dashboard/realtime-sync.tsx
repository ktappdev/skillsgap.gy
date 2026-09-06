"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type ConnectionState = "connecting" | "live" | "offline";

type RealtimeSyncProps = {
  userId: string;
  isProcessing: boolean;
};

export function RealtimeSync({ userId, isProcessing }: RealtimeSyncProps) {
  const router = useRouter();
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("skillsgap-progress-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "processing_jobs", filter: `applicant_id=eq.${userId}` }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "resume_extraction_findings", filter: `applicant_id=eq.${userId}` }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "job_matches", filter: `applicant_id=eq.${userId}` }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "interview_invitations", filter: `applicant_id=eq.${userId}` }, () => router.refresh())
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnectionState("live");
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setConnectionState("offline");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router, userId]);

  useEffect(() => {
    if (!isProcessing) return;

    const refreshInterval = window.setInterval(() => {
      router.refresh();
    }, 5000);

    return () => window.clearInterval(refreshInterval);
  }, [isProcessing, router]);

  const isLive = connectionState === "live";
  const label = isLive ? "Updating automatically" : connectionState === "connecting" ? "Connecting updates" : isProcessing ? "Checking for results" : "Updates paused";

  return (
    <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted">
      <span className={`size-2 rounded-full ${isLive ? "bg-emerald-500" : "bg-amber-400"}`} aria-hidden="true" />
      {label}
    </span>
  );
}
