import type { Metadata } from "next";
import Link from "next/link";

import { CvUpload } from "@/components/skillsgap/cv-upload";
import { ExperienceReview } from "@/components/skillsgap/experience-review";
import { MatchCard } from "@/components/skillsgap/match-card";
import { MilestonePath, StatusPill } from "@/components/skillsgap/milestone-path";
import { QualificationReview } from "@/components/skillsgap/qualification-review";
import { ClearPathwayButton } from "@/components/dashboard/clear-pathway-button";
import { RealtimeSync } from "@/components/dashboard/realtime-sync";
import { requireApplicant } from "@/lib/auth/queries";
import { getApplicantProgress } from "@/lib/skillsgap/queries";
import { demoMatches } from "@/lib/skillsgap-demo";

export const metadata: Metadata = { title: "My pathway" };

export default async function DashboardPage() {
  const { supabase, user } = await requireApplicant();
  const progress = await getApplicantProgress(supabase, user.id);
  const usingDemoMatches = progress.matches.length === 0 && !progress.latestResume;
  const matches = progress.matches.length > 0 ? progress.matches : usingDemoMatches ? demoMatches : [];
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
          <div className="flex flex-wrap items-center justify-end gap-3">
            <ClearPathwayButton />
            <RealtimeSync userId={user.id} />
          </div>
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">Good to see you, {name}.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">We start with what you can already do, then focus only on the steps that move you closer.</p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="space-y-8">
          <CvUpload key={progress.latestResume?.id ?? "no-resume"} userId={user.id} />
          <ProcessingNotice status={progress.processingStatus} error={progress.processingError} />
          <QualificationReview key={[...progress.findings.map((item) => `${item.id}-${item.updated_at}`), ...progress.qualifications.map((item) => `${item.id}-${item.updated_at}`)].join(",")} applicantId={user.id} initialFindings={progress.findings} initialQualifications={progress.qualifications} availableQualifications={progress.availableQualifications} unmappedTerms={progress.unmappedTerms} />
          <ExperienceReview key={progress.experience.map((item) => `${item.id}-${item.updated_at}`).join(",")} initialExperience={progress.experience} />
          <section aria-labelledby="matches-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Closest opportunities</p>
                <h2 id="matches-heading" className="mt-2 text-2xl font-semibold tracking-tight">Your best-fit routes</h2>
              </div>
              <StatusPill tone="accent">{roleLabel}</StatusPill>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">These routes are ranked from your confirmed profile. You do not need to know the job title first.</p>
            <div className="mt-5 grid gap-4 xl:grid-cols-2">{matches.map((match) => <MatchCard key={match.id} match={match} />)}</div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="border border-border bg-surface p-5 shadow-sm" aria-labelledby="progress-heading">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Small wins matter</p>
            <h2 id="progress-heading" className="mt-2 text-xl font-semibold tracking-tight">Your progress, made clear</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Each confirmed skill gives us a more accurate route for you.</p>
            <div className="mt-6"><MilestonePath demo={usingDemoMatches} resumeStatus={progress.latestResume?.status} processingStatus={progress.processingStatus} hasProfile={progress.qualifications.length > 0 || progress.experience.length > 0} hasMatches={progress.matches.length > 0} hasEligibleMatch={progress.matches.some((match) => match.eligible)} /></div>
          </section>
          <section className="border border-border bg-surface-muted p-5">
            <h2 className="text-lg font-semibold tracking-tight">Already completed training?</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Add a certification or update your experience so your matches can be recalculated.</p>
            <Link href="/matches/offshore-mechanical-technician" className="mt-4 inline-flex text-sm font-semibold text-accent underline-offset-4 hover:underline">Review your profile <span aria-hidden="true">→</span></Link>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ProcessingNotice({ status, error }: { status: string | null; error: string | null }) {
  if (status === "queued" || status === "processing") {
    return <section className="border border-accent/30 bg-teal-50/50 p-5" aria-live="polite"><p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Small win in progress</p><h2 className="mt-2 text-xl font-semibold tracking-tight">Your CV is being understood</h2><p className="mt-2 text-sm leading-6 text-muted">We are finding the skills you already have. This page will refresh when your first routes are ready.</p></section>;
  }
  if (status === "failed") {
    return <section className="border border-red-200 bg-red-50 p-5" aria-live="polite"><p className="text-xs font-bold uppercase tracking-[0.15em] text-danger">Needs attention</p><h2 className="mt-2 text-xl font-semibold tracking-tight">We could not finish understanding that CV</h2><p className="mt-2 text-sm leading-6 text-muted">{error ?? "Try uploading the PDF again. Your existing profile stays private."}</p></section>;
  }
  return null;
}
