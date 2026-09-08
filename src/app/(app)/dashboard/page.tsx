import type { Metadata } from "next";

import { MatchRecalculationProvider } from "@/components/dashboard/match-recalculation-context";
import { MatchResultsSection } from "@/components/dashboard/match-results-section";
import { RealtimeSync } from "@/components/dashboard/realtime-sync";
import { SavedCareerRoute } from "@/components/dashboard/saved-career-route";
import { CvUpload } from "@/components/skillsgap/cv-upload";
import { ExperienceReview } from "@/components/skillsgap/experience-review";
import { QualificationReview } from "@/components/skillsgap/qualification-review";
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
  const scanFailed = progress.latestResume?.status === "failed" || progress.processingStatus === "failed";
  const isResumeProcessing = !scanFailed && (progress.processingStatus === "queued"
    || progress.processingStatus === "processing"
    || progress.latestResume?.status === "uploaded"
    || progress.latestResume?.status === "processing");
  const matchStatus = progress.matchRecalculation?.status ?? null;
  const isMatchRecalculating = matchStatus === "queued" || matchStatus === "processing";
  const matchRecalculationError = matchStatus === "failed"
    ? progress.matchRecalculation?.error_message ?? "We could not update your matches. Review a confirmed skill and try again."
    : null;
  const matchRevision = [
    progress.matchRecalculation?.id ?? "none",
    matchStatus ?? "idle",
    ...matches.map((match) => `${match.id}:${match.score}:${match.gaps.length}`),
  ].join("|");
  const showProfileResults = !isResumeProcessing && (
    progress.latestResume?.status === "processed"
    || progress.findings.length > 0
    || progress.qualifications.length > 0
    || progress.experience.length > 0
    || matches.length > 0
  );
  const needsReview = progress.findings.length > 0 || progress.qualifications.length === 0;
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
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-border pb-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Your career pathway</p>
          <RealtimeSync userId={user.id} isProcessing={isResumeProcessing || isMatchRecalculating} />
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">Good to see you, {name}.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Upload your CV, confirm your skills, then explore jobs and training.</p>
      </header>

      {params.pathway === "saved" ? <p className="mt-6 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" role="status">Your career route is saved privately to this dashboard.</p> : null}

      <div className="mt-8">
        <div className="space-y-8">
          {showProfileResults && progress.latestResume && !scanFailed ? <details className="border-b border-border pb-4"><summary className="cursor-pointer py-2 text-sm font-semibold text-muted">CV uploaded · Manage your file</summary><div className="mt-3"><CvUpload userId={user.id} hasUploadedCv={Boolean(progress.latestResume)} resumeStatus={progress.latestResume?.status ?? null} processingStatus={progress.processingStatus} processingError={progress.processingError} /></div></details> : <CvUpload
            key={progress.latestResume?.id ?? "no-resume"}
            userId={user.id}
            hasUploadedCv={Boolean(progress.latestResume)}
            resumeStatus={progress.latestResume?.status ?? null}
            processingStatus={progress.processingStatus}
            processingError={progress.processingError}
          />}
          {showProfileResults ? <MatchRecalculationProvider key={matchRevision}>
            <QualificationReview applicantId={user.id} initialFindings={progress.findings} initialQualifications={progress.qualifications} availableQualifications={progress.availableQualifications} unmappedTerms={progress.unmappedTerms} />
            {progress.qualifications.length > 0 || usingDemoMatches ? <MatchResultsSection matches={matches} roleLabel={roleLabel} isRecalculating={isMatchRecalculating} recalculationError={matchRecalculationError} /> : <p id="matches-area" className="scroll-mt-6 rounded-md bg-surface-muted p-4 text-sm text-muted">Your job matches will appear here after you confirm a skill above.</p>}
            {progress.experience.length > 0 ? <details className="border-t border-border pt-4"><summary className="cursor-pointer py-2 text-sm font-semibold text-muted">Work history · {progress.experience.length} entries · Edit if needed</summary><div className="mt-3"><ExperienceReview key={progress.experience.map((item) => `${item.id}-${item.updated_at}`).join(",")} initialExperience={progress.experience} /></div></details> : null}
          </MatchRecalculationProvider> : null}
          {!isResumeProcessing && progress.pathwayPlan ? <details className="border-t border-border pt-4"><summary className="cursor-pointer py-2 text-sm font-semibold text-muted">Your saved career route</summary><div className="mt-3"><SavedCareerRoute plan={progress.pathwayPlan} /></div></details> : showProfileResults && !needsReview ? <SavedCareerRoute plan={null} /> : null}
        </div>
      </div>
    </div>
  );
}
