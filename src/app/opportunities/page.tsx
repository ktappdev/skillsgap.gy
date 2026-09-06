import type { Metadata } from "next";

import { PositionCard } from "@/components/shareable/position-card";
import { PublicContentHeader } from "@/components/shareable/public-content-header";
import { getPublicPositions } from "@/lib/share/public-content";

export const metadata: Metadata = {
  title: "Explore positions",
  description: "Explore shareable positions connected to Guyana's local-content economy.",
};

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const positions = await getPublicPositions();

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <PublicContentHeader active="positions" />

        <section className="relative mt-8 overflow-hidden border border-foreground bg-foreground p-6 text-white sm:p-10 lg:p-14" aria-labelledby="positions-title">
          <div aria-hidden="true" className="absolute -right-16 -top-16 size-56 border-[24px] border-accent/30" />
          <div className="relative max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Share a next step</p>
            <h1 id="positions-title" className="mt-4 text-4xl font-semibold leading-[1.04] tracking-[-0.05em] sm:text-6xl">Real positions. Clearer ways forward.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">Explore opportunities connected to Guyana&apos;s local-content economy, then send one to someone who is ready for their next move.</p>
          </div>
        </section>

        <section className="mt-10" aria-labelledby="position-list-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Open pathways</p>
              <h2 id="position-list-title" className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Find a position worth sharing</h2>
            </div>
            <p className="text-sm text-muted">{positions.length} {positions.length === 1 ? "position" : "positions"}</p>
          </div>

          {positions.length > 0 ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {positions.map((position) => <PositionCard key={position.id} position={position} />)}
            </div>
          ) : (
            <div className="mt-5 border border-dashed border-accent/50 bg-teal-50/30 p-6 text-sm leading-6 text-muted">No public positions are available right now. Check back soon, or build a career route from your current skills.</div>
          )}
        </section>

        <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-6 text-muted">Position details can change. Confirm the current vacancy, requirements, and application process with the employer before making a decision.</p>
        <footer className="flex flex-col gap-2 py-8 text-sm text-muted sm:flex-row sm:justify-between"><span>SkillsGap.gy</span><span>Skills → opportunities → training</span></footer>
      </div>
    </main>
  );
}
