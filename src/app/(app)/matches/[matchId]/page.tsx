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
import { getDemoMatch } from "@/lib/skillsgap-demo";
import { getApplicantMatch } from "@/lib/skillsgap/queries";

export default async function MatchDetailPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const { supabase, user } = await requireApplicant();
  const liveMatch = await getApplicantMatch(supabase, user.id, matchId);
  const match = liveMatch ?? getDemoMatch(matchId, isDemoApplicantMetadata(user.user_metadata));
  if (!match) notFound();

  const eligibilityProgress = Math.min(Math.round((match.score / match.threshold) * 100), 100);

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
          <ShareProfileButton roleId={match.roleId} alreadyShared={match.consented} />
          <ApplyButton roleId={match.roleId} initialStatus={match.applicationStatus} eligible={match.score >= match.threshold} threshold={match.threshold} />
          <section className="border border-border bg-surface p-5" aria-labelledby="privacy-choices-heading">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Your privacy choices</p>
            <h2 id="privacy-choices-heading" className="mt-2 text-lg font-semibold text-foreground">Interest and identity are separate.</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted" role="list">
              <li><span className="font-semibold text-foreground">Apply</span> tells the company you are interested without sharing your name or CV.</li>
              <li><span className="font-semibold text-foreground">Share your profile privately</span> lets this company see your contact details for this role.</li>
              <li><span className="font-semibold text-foreground">Share position</span> sends a public role link to someone else.</li>
            </ul>
          </section>
        </div>
      ) : null}

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Interview eligibility</h2>
          <p className="mt-1 text-sm text-muted">{eligibilityProgress}% there</p>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface-muted"><div className="h-full bg-accent" style={{ width: `${eligibilityProgress}%` }} /></div>
          <p className="mt-3 text-sm leading-6 text-muted">Target: {match.threshold}% plus every mandatory requirement.</p>
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

      <section className="mt-6 rounded-lg border border-border bg-surface p-5 sm:p-6" aria-labelledby="gaps-heading">
        <h2 id="gaps-heading" className="text-2xl font-semibold tracking-tight text-foreground">
          {match.gaps.length} {match.gaps.length === 1 ? "requirement" : "requirements"} left
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Start with the first one. Open the provider, confirm details, save it to your plan.
        </p>
        <GapActionList gaps={match.gaps} isDemo={match.isDemo} />
      </section>
    </div>
  );
}
