"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type ConnectionState = "connecting" | "live" | "offline";

export function RealtimeSync({ userId }: { userId: string }) {
  const router = useRouter();
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("skillsgap-progress-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "processing_jobs", filter: `applicant_id=eq.${userId}` }, () => router.refresh())
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

  const isLive = connectionState === "live";

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted">
      <span className={`size-2 rounded-full ${isLive ? "bg-emerald-500" : "bg-amber-400"}`} aria-hidden="true" />
      {connectionState === "connecting" ? "Connecting live sync" : isLive ? "Live sync on" : "Live sync offline"}
    </span>
  );
}
