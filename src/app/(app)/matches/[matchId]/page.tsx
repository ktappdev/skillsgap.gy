import Link from "next/link";
import { notFound } from "next/navigation";

import { ApplyButton } from "@/components/skillsgap/apply-button";
import { GapActionList } from "@/components/skillsgap/gap-action-list";
import { StatusPill } from "@/components/skillsgap/milestone-path";
import { ShareProfileButton } from "@/components/skillsgap/share-profile-button";
import { ShareButton } from "@/components/shareable/share-button";
import { buildPositionShareText } from "@/lib/share/messages";
import { isDemoApplicantMetadata } from "@/lib/auth/demo";
import { requireApplicant } from "@/lib/auth/queries";
import { getDemoMatch, type Match } from "@/lib/skillsgap-demo";
import { getApplicantMatch } from "@/lib/skillsgap/queries";

/**
 * The requirements section has three honest states. A match with no gaps can
 * still be ineligible — a role that publishes no weighted requirements scores 0
 * while every (vacuous) requirement is met — so the "meets every requirement"
 * claim is gated on `match.eligible`, which is interview eligibility: every
 * mandatory requirement *and* the score threshold.
 */
function RequirementsSection({ match }: { match: Match }) {
  if (match.gaps.length === 0 && match.eligible) {
    return (
      <section className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-5 sm:p-6" role="status">
        <h2 className="text-2xl font-semibold tracking-tight text-emerald-900">You meet every published requirement for this role.</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-800">Your score of {match.score}% meets the {match.threshold}% interview threshold and every mandatory requirement.</p>
        <Link href="/interviews" className="mt-3 inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong">
          View your interviews <span className="ml-1" aria-hidden="true">→</span>
        </Link>
      </section>
    );
  }

  if (match.gaps.length === 0) {
    return (
      <section className="mt-6 rounded-lg border border-border bg-surface p-5 sm:p-6" role="status">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">No published requirements to close</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">This role has no requirements published yet, so there is nothing to close. Your score of {match.score}% is still below the {match.threshold}% interview threshold.</p>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-lg border border-border bg-surface p-5 sm:p-6" aria-labelledby="gaps-heading">
      <h2 id="gaps-heading" className="text-2xl font-semibold tracking-tight text-foreground">
        {match.gaps.length} {match.gaps.length === 1 ? "requirement" : "requirements"} left
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Required items must be met for interview eligibility. Preferred items strengthen your match and can guide your next step.</p>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        Start with the first one. Open the provider, confirm details, save it to your plan.
      </p>
      <GapActionList gaps={match.gaps} isDemo={match.isDemo} />
    </section>
  );
}

export default async function MatchDetailPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const { supabase, user } = await requireApplicant(`/matches/${matchId}`);
  const liveMatch = await getApplicantMatch(supabase, user.id, matchId);
  const match = liveMatch ?? getDemoMatch(matchId, isDemoApplicantMetadata(user.user_metadata));
  if (!match) notFound();
  const resumeResult = liveMatch
    ? await supabase.from("resumes").select("id").eq("applicant_id", user.id).is("deleted_at", null).limit(1).maybeSingle()
    : null;
  const profileResult = liveMatch
    ? await supabase.from("profiles").select("contact_email").eq("id", user.id).maybeSingle()
    : null;
  const hasResume = Boolean(resumeResult?.data);
  const hasContactEmail = Boolean(profileResult?.data?.contact_email?.trim());

  // Progress toward the score threshold only — never a readiness claim. Interview
  // eligibility also needs every mandatory requirement, which only `match.eligible`
  // reports, so this bar can reach 100% while required items are still unmet.
  const thresholdProgress = match.threshold > 0 ? Math.min(Math.round((match.score / match.threshold) * 100), 100) : 0;
  const pointsToThreshold = Math.max(match.threshold - match.score, 0);
  const unmetMandatoryCount = match.gaps.filter((gap) => gap.mandatory).length;
  const eligibilitySummary = match.eligible
    ? "Score and mandatory requirements met."
    : pointsToThreshold > 0
      ? `${pointsToThreshold} ${pointsToThreshold === 1 ? "point" : "points"} to the interview threshold.`
      : "Score met; review mandatory requirements.";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href="/dashboard"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline"
      >
        ← Back to my pathway
      </Link>

      <header className="mt-6 border-b border-border pb-6">
        <p className="text-sm text-muted">{match.company}{match.isDemo ? " · Demo pathway" : ""}</p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{match.title}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill tone="accent">{match.score}% match</StatusPill>
            {match.roleId ? <ShareButton url={`/opportunities/${match.roleId}`} title={match.title} text={buildPositionShareText({ title: match.title, company: match.company, location: null })} label="Share position" variant="light" /> : null}
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          From the experience you confirmed in your profile.
        </p>
      </header>

      {liveMatch ? (
        <div className="mt-6 space-y-4">
          <ShareProfileButton roleId={match.roleId} alreadyShared={match.consented} hasResume={hasResume} hasContactEmail={hasContactEmail} />
          <ApplyButton roleId={match.roleId} initialStatus={match.applicationStatus} eligible={match.score >= match.threshold} threshold={match.threshold} />
          <section className="rounded-lg border border-border bg-surface p-5" aria-labelledby="privacy-choices-heading">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Your privacy choices</p>
            <h2 id="privacy-choices-heading" className="mt-2 text-lg font-semibold text-foreground">Interest and identity are separate.</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted" role="list">
              <li><span className="font-semibold text-foreground">Apply</span> tells the company you are interested without sharing your name or CV.</li>
              <li><span className="font-semibold text-foreground">Share your profile privately</span> lets this company see your name and phone number{hasContactEmail ? " and contact email" : ""}{hasResume ? " and open your CV" : ""} for this role. Your sign-in email stays private.</li>
              <li><span className="font-semibold text-foreground">Share position</span> sends a public role link to someone else.</li>
            </ul>
          </section>
        </div>
      ) : null}

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Interview eligibility</h2>
          <p className={`mt-1 text-sm font-semibold ${match.eligible ? "text-emerald-800" : "text-muted"}`}>{eligibilitySummary}</p>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface-muted"><div className="h-full bg-accent" style={{ width: `${thresholdProgress}%` }} /></div>
          <p className="mt-3 text-sm leading-6 text-muted">Score {match.score}% against the {match.threshold}% interview threshold.{unmetMandatoryCount > 0 ? ` ${unmetMandatoryCount} required ${unmetMandatoryCount === 1 ? "item is" : "items are"} still unmet.` : " Every mandatory requirement is met."}</p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">What already counts</h2>
          {match.strengths.length > 0 ? (
            <ul className="mt-3 space-y-3" role="list">
              {match.strengths.map((strength) => (
                <li key={strength} className="flex gap-3 text-sm"><span className="grid size-5 place-items-center rounded-full bg-accent text-xs font-bold text-white" aria-hidden="true">✓</span><span>{strength}</span></li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted">Confirm the CV translations that describe your experience.</p>
          )}
        </div>
      </section>

      <RequirementsSection match={match} />
    </div>
  );
}
