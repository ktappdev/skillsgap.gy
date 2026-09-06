import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicContentHeader } from "@/components/shareable/public-content-header";
import { ShareButton } from "@/components/shareable/share-button";
import { buildPositionShareText } from "@/lib/share/messages";
import { getPublicPosition, type PublicPositionRequirement } from "@/lib/share/public-content";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

type PositionPageProps = {
  params: Promise<{ roleId: string }>;
};

export async function generateMetadata({ params }: PositionPageProps): Promise<Metadata> {
  const { roleId } = await params;
  const position = await getPublicPosition(roleId);
  if (!position) return { title: "Position not found" };

  const description = `Explore ${position.title} at ${position.company.name}, see what the role asks for, and find a next step with SkillsGap.gy.`;
  return {
    title: position.title,
    description,
    openGraph: {
      type: "website",
      title: `${position.title} · SkillsGap.gy`,
      description,
      url: `${env.siteUrl}/opportunities/${position.id}`,
      siteName: "SkillsGap.gy",
    },
    twitter: {
      card: "summary",
      title: `${position.title} · SkillsGap.gy`,
      description,
    },
  };
}

export default async function PositionPage({ params }: PositionPageProps) {
  const { roleId } = await params;
  const position = await getPublicPosition(roleId);
  if (!position) notFound();

  const positionUrl = `/opportunities/${position.id}`;
  const shareText = buildPositionShareText({ title: position.title, company: position.company.name, location: position.location });

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <PublicContentHeader active="positions" />

        <section className="relative mt-8 overflow-visible border border-foreground bg-foreground p-6 text-white sm:p-10 lg:p-14" aria-labelledby="position-title">
          <div aria-hidden="true" className="absolute -right-20 -top-20 size-64 border-[28px] border-accent/30" />
          <div className="relative max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">{position.isDemo ? "Curated demo position" : "Company-published position"}</p>
            <p className="mt-5 text-sm font-semibold text-slate-300">{position.company.name}</p>
            <h1 id="position-title" className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.04] tracking-[-0.05em] sm:text-6xl">{position.title}</h1>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
              <span>{position.location}</span>
              {position.employmentType ? <span>{position.employmentType}</span> : null}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ShareButton url={positionUrl} title={position.title} text={shareText} label="Share this position" variant="accent" />
              <Link href="/signup" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/25 px-4 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300">Build my private profile <span aria-hidden="true" className="ml-2">→</span></Link>
            </div>
          </div>
        </section>

        {position.isDemo ? <aside className="mt-5 border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950" aria-label="Demo position notice"><span className="font-semibold">Curated demonstration:</span> this position helps show how SkillsGap.gy connects experience to opportunity. It is not a live vacancy or promise of employment.</aside> : null}

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-8">
            <section className="border border-border bg-surface p-6 shadow-sm sm:p-8" aria-labelledby="position-about-title">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">About the position</p>
              <h2 id="position-about-title" className="mt-2 text-2xl font-semibold tracking-tight text-foreground">What this route could look like</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted">{position.description || "Explore the position details and ask the employer what evidence they value most."}</p>
            </section>

            <section className="border border-border bg-surface p-6 shadow-sm sm:p-8" aria-labelledby="requirements-title">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">What may help you get closer</p>
              <h2 id="requirements-title" className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Skills and qualifications to explore</h2>
              <p className="mt-3 text-sm leading-6 text-muted">These are the requirements currently connected to this position. A requirement is a starting point for your plan, not a judgement on your potential.</p>
              {position.requirements.length > 0 ? <ul className="mt-5 divide-y divide-border border-y border-border" role="list">{position.requirements.map((requirement) => <RequirementRow key={requirement.id} requirement={requirement} />)}</ul> : <p className="mt-5 border border-dashed border-accent/50 bg-teal-50/30 p-4 text-sm leading-6 text-muted">The employer has not published requirements for this position yet. Ask what evidence they accept before applying.</p>}
            </section>
          </div>

          <aside className="space-y-5">
            <section className="border border-border bg-surface-muted p-5" aria-labelledby="next-step-title">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Your next step</p>
              <h2 id="next-step-title" className="mt-2 text-xl font-semibold tracking-tight text-foreground">See what you already bring</h2>
              <p className="mt-2 text-sm leading-6 text-muted">A private SkillsGap.gy profile can compare your experience with opportunities and point you toward training for the gaps that matter.</p>
              <Link href="/signup" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Find my route <span aria-hidden="true" className="ml-2">→</span></Link>
            </section>
            {position.company.website_url?.startsWith("https://") ? <section className="border border-border bg-surface p-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Employer</p><h2 className="mt-2 text-lg font-semibold text-foreground">{position.company.name}</h2>{position.company.description ? <p className="mt-2 text-sm leading-6 text-muted">{position.company.description}</p> : null}<a href={position.company.website_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-semibold text-accent underline-offset-4 hover:underline">Visit employer site <span aria-hidden="true" className="ml-1">↗</span></a></section> : null}
          </aside>
        </div>

        <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-6 text-muted">Position details, vacancies, entry requirements, and training dates can change. Confirm the current details directly with the employer or a recognised training provider.</p>
        <footer className="flex flex-col gap-2 py-8 text-sm text-muted sm:flex-row sm:justify-between"><Link href="/opportunities" className="font-semibold text-accent hover:underline">← Explore all positions</Link><span>SkillsGap.gy · Help someone take their next step</span></footer>
      </div>
    </main>
  );
}

function RequirementRow({ requirement }: { requirement: PublicPositionRequirement }) {
  return <li className="flex flex-wrap items-start justify-between gap-3 py-4"><div><p className="font-semibold text-foreground">{requirement.qualificationName}</p><p className="mt-1 text-sm capitalize text-muted">{requirement.kind.replaceAll("_", " ")}{requirement.minimum_years ? ` · ${requirement.minimum_years}+ years` : ""}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${requirement.mandatory ? "bg-amber-100 text-amber-900" : "bg-surface-muted text-accent"}`}>{requirement.mandatory ? "Important" : "Helpful"}</span></li>;
}
