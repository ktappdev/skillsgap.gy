import type { Metadata } from "next";
import Link from "next/link";

import { ApplicantContactDetails } from "@/components/dashboard/applicant-contact-details";
import { MatchRecalculationProvider } from "@/components/dashboard/match-recalculation-context";
import { MatchResultsSection } from "@/components/dashboard/match-results-section";
import { PathwaySteps, type PathwayStep } from "@/components/dashboard/pathway-steps";
import { RealtimeSync } from "@/components/dashboard/realtime-sync";
import { SavedCareerRoute } from "@/components/dashboard/saved-career-route";
import { CvUpload } from "@/components/skillsgap/cv-upload";
import { ExperienceReview } from "@/components/skillsgap/experience-review";
import { QualificationReview } from "@/components/skillsgap/qualification-review";
import { isDemoApplicantMetadata } from "@/lib/auth/demo";
import { requireApplicant } from "@/lib/auth/queries";
import { getPublicPosition, type PublicPosition } from "@/lib/share/public-content";
import { getApplicantProgress } from "@/lib/skillsgap/queries";
import { demoMatches, shouldUseDemoMatches } from "@/lib/skillsgap-demo";

export const metadata: Metadata = { title: "My pathway" };

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { supabase, user } = await requireApplicant();
  const [progress, params, profileResult] = await Promise.all([
    getApplicantProgress(supabase, user.id),
    searchParams,
    supabase.from("profiles").select("full_name,phone_number").eq("id", user.id).maybeSingle(),
  ]);
  const profile = profileResult.data;
  const requestedRole = typeof params.roleId === "string" ? await getPublicPosition(params.roleId) : null;
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
  const profileName = profile?.full_name?.trim() ?? "";
  const metadataFullName = typeof metadataName === "string" ? metadataName.trim() : "";
  const name = profileName || metadataFullName || user.email?.split("@")[0] || "there";
  const pathwaySteps: readonly PathwayStep[] = [
    {
      label: "Build your profile",
      detail: isResumeProcessing ? "Your CV is being read" : showProfileResults ? "Your profile is ready" : "Upload a CV or add a skill",
      href: "#cv-upload",
      state: isResumeProcessing ? "current" : showProfileResults ? "complete" : "current",
    },
    {
      label: "Add or confirm skills",
      detail: progress.findings.length > 0 ? `${progress.findings.length} to review` : progress.qualifications.length > 0 ? `${progress.qualifications.length} confirmed` : "Add skills or upload a CV",
      href: "#skills-review",
      state: needsReview ? "current" : progress.qualifications.length > 0 ? "complete" : "next",
    },
    {
      label: "Explore your routes",
      detail: matches.length > 0 ? `${matches.length} closest route${matches.length === 1 ? "" : "s"}` : "Matches follow confirmation",
      href: "#matches-area",
      state: matches.length > 0 ? "complete" : progress.qualifications.length > 0 ? "current" : "next",
    },
    {
      label: "Take the next step",
      detail: matches.some((match) => match.eligible) ? "Interview options are ready" : matches.length > 0 ? "Choose a gap or course" : "Your next move appears here",
      href: matches.some((match) => match.eligible) ? "/interviews" : "#matches-area",
      state: matches.some((match) => match.eligible) ? "complete" : matches.length > 0 ? "current" : "next",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-border pb-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Your career pathway</p>
          <RealtimeSync userId={user.id} isProcessing={isResumeProcessing || isMatchRecalculating} />
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">Good to see you, {name}.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{isResumeProcessing ? "We’re reading your CV. Once it’s ready, confirm your skills and we’ll show fitting roles and training for the gaps." : <>Upload your CV or <a href="#skills-review" className="font-semibold text-accent underline-offset-4 hover:underline">add skills yourself</a>. We’ll show the roles that fit and training for the gaps—no job title needed.</>}</p>
      </header>

      <div className="mt-6">
        <PathwaySteps steps={pathwaySteps} />
      </div>

      {profile ? <div className="mt-4"><ApplicantContactDetails email={user.email ?? null} fullName={profile.full_name ?? ""} phoneNumber={profile.phone_number ?? ""} initiallyOpen={params.editContact === "1"} /></div> : <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-danger" role="alert">We couldn’t load your contact details. Refresh this page and try again.</p>}

      {requestedRole ? <RoleContextBanner role={requestedRole} /> : null}

      {params.pathway === "saved" ? <p className="mt-6 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" role="status">Your career route is saved privately to this dashboard.</p> : null}

      {params.pathway === "saved" && progress.pathwayPlan ? <div className="mt-6"><SavedCareerRoute plan={progress.pathwayPlan} /></div> : null}

      <div className="mt-8">
        <div className="space-y-8">
          <div id="cv-upload" className="scroll-mt-6">
            {showProfileResults && progress.latestResume && !scanFailed ? <details className="border-b border-border pb-4"><summary className="cursor-pointer py-2 text-sm font-semibold text-muted">CV uploaded · Manage your file</summary><div className="mt-3"><CvUpload userId={user.id} hasUploadedCv={Boolean(progress.latestResume)} resumeStatus={progress.latestResume?.status ?? null} processingStatus={progress.processingStatus} processingError={progress.processingError} /></div></details> : <CvUpload
              key={progress.latestResume?.id ?? "no-resume"}
              userId={user.id}
              hasUploadedCv={Boolean(progress.latestResume)}
              resumeStatus={progress.latestResume?.status ?? null}
              processingStatus={progress.processingStatus}
              processingError={progress.processingError}
            />}
          </div>
          <MatchRecalculationProvider key={matchRevision}>
            {isResumeProcessing ? <section id="skills-review" className="scroll-mt-6 rounded-lg border border-border bg-surface-muted p-5" aria-labelledby="skills-processing-heading" role="status">
              <h2 id="skills-processing-heading" className="text-lg font-semibold text-foreground">Next, review your skills</h2>
              <p className="mt-2 text-sm leading-6 text-muted">When the CV scan finishes, we’ll list suggested skills here. Only skills you confirm affect your job matches.</p>
            </section> : <QualificationReview applicantId={user.id} hasResume={Boolean(progress.latestResume)} resumeScanFailed={scanFailed} initialFindings={progress.findings} initialQualifications={progress.qualifications} availableQualifications={progress.availableQualifications} unmappedTerms={progress.unmappedTerms} />}
            {!isResumeProcessing ? progress.qualifications.length > 0 || usingDemoMatches ? <MatchResultsSection matches={matches} roleLabel={roleLabel} isRecalculating={isMatchRecalculating} recalculationError={matchRecalculationError} /> : <p id="matches-area" className="scroll-mt-6 rounded-md bg-surface-muted p-4 text-sm text-muted">Your job matches will appear here after you confirm or add a skill above.</p> : null}
            {!isResumeProcessing && progress.experience.length > 0 ? <details className="border-t border-border pt-4"><summary className="cursor-pointer py-2 text-sm font-semibold text-muted">Work history · {progress.experience.length} entries · Edit if needed</summary><div className="mt-3"><ExperienceReview key={progress.experience.map((item) => `${item.id}-${item.updated_at}`).join(",")} initialExperience={progress.experience} /></div></details> : null}
          </MatchRecalculationProvider>
          {!isResumeProcessing && params.pathway !== "saved" ? progress.pathwayPlan ? <details className="border-t border-border pt-4"><summary className="cursor-pointer py-2 text-sm font-semibold text-muted">Your saved career route</summary><div className="mt-3"><SavedCareerRoute plan={progress.pathwayPlan} /></div></details> : showProfileResults && !needsReview ? <SavedCareerRoute plan={null} /> : null : null}
        </div>
      </div>
    </div>
  );
}

function RoleContextBanner({ role }: { role: PublicPosition }) {
  return (
    <section className="mt-6 flex flex-col gap-4 border border-accent/30 bg-teal-50/50 p-4 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="role-context-heading">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">You came from a position</p>
        <h2 id="role-context-heading" className="mt-1 text-base font-semibold text-foreground">Keep {role.title} in view</h2>
        <p className="mt-1 text-sm leading-6 text-muted">Build your private profile here, then return to this role to compare your confirmed experience.</p>
      </div>
      <Link href={`/opportunities/${role.id}`} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border border-accent px-4 text-sm font-semibold text-accent hover:bg-white">Review position</Link>
    </section>
  );
}
