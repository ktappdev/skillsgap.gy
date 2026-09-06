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

        <section className="mt-6 max-w-3xl" aria-labelledby="positions-title">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Positions</p>
          <h1 id="positions-title" className="mt-3 text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
            Roles worth a look.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted">
            Open roles connected to Guyana&apos;s local-content economy. Send one
            to someone ready for a next move.
          </p>
        </section>

        <section className="mt-12" aria-labelledby="position-list-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="position-list-title" className="text-2xl font-semibold tracking-tight text-foreground">
              Open positions
            </h2>
            <p className="text-sm text-muted">{positions.length} {positions.length === 1 ? "position" : "positions"}</p>
          </div>

          {positions.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {positions.map((position) => <PositionCard key={position.id} position={position} />)}
            </div>
          ) : (
            <div className="mt-6 rounded-lg border border-dashed border-border bg-surface p-6 text-sm leading-6 text-muted">
              No public positions right now. Check back soon, or build a career
              route from your current skills.
            </div>
          )}
        </section>

        <p className="mx-auto mt-6 max-w-3xl text-sm leading-6 text-muted">
          Position details can change. Confirm the vacancy and requirements with
          the employer before deciding.
        </p>
        <footer className="flex flex-col gap-2 py-6 text-sm text-muted sm:flex-row sm:justify-between">
          <span>SkillsGap.gy</span>
          <span>Skills → opportunities → training</span>
        </footer>
      </div>
    </main>
  );
}
