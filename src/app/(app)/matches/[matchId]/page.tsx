import Link from "next/link";
import { notFound } from "next/navigation";

import { ApplyButton } from "@/components/skillsgap/apply-button";
import { GapActionList } from "@/components/skillsgap/gap-action-list";
import { StatusPill } from "@/components/skillsgap/milestone-path";
import { ShareProfileButton } from "@/components/skillsgap/share-profile-button";
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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/dashboard" className="text-sm font-semibold text-accent underline-offset-4 hover:underline">← Back to my pathway</Link>

      <header className="mt-7 border-b border-border pb-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{match.company}</p>
        <p className="mt-2 text-xs font-semibold text-accent">{match.isDemo ? "Curated demo pathway" : "Company-published role"}</p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">{match.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Based on the experience you confirmed in your profile.</p>
          </div>
          <StatusPill tone="accent">{match.score}% match</StatusPill>
        </div>
      </header>

      {liveMatch ? (
        <div className="mt-6 space-y-4">
          <ShareProfileButton roleId={match.roleId} alreadyShared={match.consented} />
          <ApplyButton roleId={match.roleId} initialStatus={match.applicationStatus} eligible={match.score >= match.threshold} threshold={match.threshold} />
        </div>
      ) : null}

      <section className="mt-8 grid gap-5 md:grid-cols-[.9fr_1.1fr]">
        <div className="border border-border bg-surface p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Your next milestone</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">{eligibilityProgress}% toward interview eligibility</h2>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-surface-muted"><div className="h-full bg-accent" style={{ width: `${eligibilityProgress}%` }} /></div>
          <p className="mt-4 text-sm leading-6 text-muted">Target: {match.threshold}% and every mandatory requirement confirmed.</p>
        </div>

        <div className="border border-border bg-surface p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">What already counts</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">Strengths we recognized</h2>
          {match.strengths.length > 0 ? (
            <ul className="mt-4 space-y-3" role="list">
              {match.strengths.map((strength) => (
                <li key={strength} className="flex gap-3 text-sm"><span className="grid size-5 place-items-center rounded-full bg-accent text-xs font-bold text-white" aria-hidden="true">✓</span><span>{strength}</span></li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-6 text-muted">Confirm the CV translations that accurately describe your experience.</p>
          )}
        </div>
      </section>

      <section className="mt-8 border border-border bg-surface p-5 shadow-sm sm:p-7" aria-labelledby="gaps-heading">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">A practical route forward</p>
        <h2 id="gaps-heading" className="mt-2 text-2xl font-semibold tracking-tight">{match.gaps.length} requirements left</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Start with the first requirement. Open the provider, confirm the details, then save it to your plan.</p>
        <GapActionList gaps={match.gaps} isDemo={match.isDemo} />
      </section>
    </div>
  );
}
