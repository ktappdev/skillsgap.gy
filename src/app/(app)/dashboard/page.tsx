import type { Metadata } from "next";
import Link from "next/link";

import { CvUpload } from "@/components/skillsgap/cv-upload";
import { ExperienceReview } from "@/components/skillsgap/experience-review";
import { MatchCard } from "@/components/skillsgap/match-card";
import { MilestonePath, StatusPill } from "@/components/skillsgap/milestone-path";
import { QualificationReview } from "@/components/skillsgap/qualification-review";
import { RealtimeSync } from "@/components/dashboard/realtime-sync";
import { SavedCareerRoute } from "@/components/dashboard/saved-career-route";
import { isDemoApplicantMetadata } from "@/lib/auth/demo";
import { requireApplicant } from "@/lib/auth/queries";
import { getApplicantProgress } from "@/lib/skillsgap/queries";
import { demoMatches, shouldUseDemoMatches } from "@/lib/skillsgap-demo";

export const metadata: Metadata = { title: "My pathway" };

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { supabase, user } = await requireApplicant();
  const [progress, params] = await Promise.all([getApplicantProgress(supabase, user.id), searchParams]);
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
  const showProfileResults = !isProcessing && (
    progress.latestResume?.status === "processed"
    || progress.findings.length > 0
    || progress.qualifications.length > 0
    || progress.experience.length > 0
    || matches.length > 0
  );
  const roleCount = usingDemoMatches ? matches.length : progress.visibleRoleCount;
  const roleLabel = usingDemoMatches
    ? "Demo pathways"
    : roleCount > matches.length
      ? `Top ${matches.length} of ${roleCount} roles`
      : roleCount === 0
        ? "No roles yet"
        : `${roleCount} roles found`;
  const metadataName = user.user_metadata.full_name;
  const name = typeof metadataName === "string" && metadataName.trim()
    ? metadataName.trim()
    : user.email?.split("@")[0] || "there";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-border pb-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Your career pathway</p>
          <RealtimeSync userId={user.id} isProcessing={isProcessing} />
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">Good to see you, {name}.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">We start with what you can already do, then focus only on the steps that move you closer.</p>
      </header>

      {params.pathway === "saved" ? <p className="mt-6 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" role="status">Your career route is saved privately to this dashboard.</p> : null}

      <div className={isProcessing ? "mt-8 max-w-3xl" : "mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]"}>
        <div className="space-y-8">
          <CvUpload
            key={progress.latestResume?.id ?? "no-resume"}
            userId={user.id}
            hasUploadedCv={Boolean(progress.latestResume)}
            resumeStatus={progress.latestResume?.status ?? null}
            processingStatus={progress.processingStatus}
            processingError={progress.processingError}
          />
          {!isProcessing && progress.pathwayPlan ? <SavedCareerRoute plan={progress.pathwayPlan} /> : null}
          {showProfileResults ? <QualificationReview applicantId={user.id} initialFindings={progress.findings} initialQualifications={progress.qualifications} availableQualifications={progress.availableQualifications} unmappedTerms={progress.unmappedTerms} /> : null}
          {showProfileResults ? <ExperienceReview key={progress.experience.map((item) => `${item.id}-${item.updated_at}`).join(",")} initialExperience={progress.experience} /> : null}
          {showProfileResults ? <section aria-labelledby="matches-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Closest opportunities</p>
                <h2 id="matches-heading" className="mt-2 text-2xl font-semibold tracking-tight">Your best-fit routes</h2>
              </div>
              <StatusPill tone="accent">{roleLabel}</StatusPill>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">These routes are ranked from your confirmed profile. You do not need to know the job title first.</p>
            <div className="mt-5 grid gap-4 xl:grid-cols-2">{matches.map((match) => <MatchCard key={match.id} match={match} />)}</div>
          </section> : null}
          {!isProcessing && !progress.pathwayPlan ? <SavedCareerRoute plan={null} /> : null}
        </div>

        {!isProcessing ? <aside className="space-y-6">
          <section className="border border-border bg-surface p-5 shadow-sm" aria-labelledby="progress-heading">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Small wins matter</p>
            <h2 id="progress-heading" className="mt-2 text-xl font-semibold tracking-tight">Your progress, made clear</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Each confirmed skill gives us a more accurate route for you.</p>
            <div className="mt-6"><MilestonePath demo={usingDemoMatches} resumeStatus={progress.latestResume?.status} processingStatus={progress.processingStatus} hasProfile={progress.qualifications.length > 0 || progress.experience.length > 0} hasMatches={progress.matches.length > 0} hasEligibleMatch={progress.matches.some((match) => match.eligible)} /></div>
          </section>
          {usingDemoMatches ? <section className="border border-border bg-surface-muted p-5">
            <h2 className="text-lg font-semibold tracking-tight">Already completed training?</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Add a certification or update your experience so your matches can be recalculated.</p>
            <Link href="/matches/offshore-mechanical-technician" className="mt-4 inline-flex text-sm font-semibold text-accent underline-offset-4 hover:underline">Review the demo pathway <span aria-hidden="true">→</span></Link>
          </section> : null}
        </aside> : null}
      </div>
    </div>
  );
}
