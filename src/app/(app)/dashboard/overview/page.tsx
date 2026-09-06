import type { Metadata } from "next";

import { ApplicantOverview } from "@/components/dashboard/applicant-overview";
import { RealtimeSync } from "@/components/dashboard/realtime-sync";
import { isDemoApplicantMetadata } from "@/lib/auth/demo";
import { requireApplicant } from "@/lib/auth/queries";
import { demoMatches, shouldUseDemoMatches } from "@/lib/skillsgap-demo";
import { getApplicantProgress } from "@/lib/skillsgap/queries";

export const metadata: Metadata = { title: "Dashboard" };

export default async function ApplicantDashboardOverviewPage() {
  const { supabase, user } = await requireApplicant();
  const progress = await getApplicantProgress(supabase, user.id);
  const usingDemoMatches = shouldUseDemoMatches({
    isDemoApplicant: isDemoApplicantMetadata(user.user_metadata),
    matchCount: progress.matches.length,
    hasResume: Boolean(progress.latestResume),
  });
  const matches = progress.matches.length > 0 ? progress.matches : usingDemoMatches ? demoMatches : [];
  const isProcessing = progress.processingStatus === "queued"
    || progress.processingStatus === "processing"
    || progress.latestResume?.status === "uploaded"
    || progress.latestResume?.status === "processing";
  const metadataName = user.user_metadata.full_name;
  const name = typeof metadataName === "string" && metadataName.trim()
    ? metadataName.trim()
    : user.email?.split("@")[0] || "there";

  return (
    <>
      {isProcessing ? <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8"><RealtimeSync userId={user.id} isProcessing /></div> : null}
      <ApplicantOverview name={name} progress={progress} matches={matches} usingDemoMatches={usingDemoMatches} isProcessing={isProcessing} />
    </>
  );
}
