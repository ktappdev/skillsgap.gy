import type { Metadata } from "next";
import Link from "next/link";

import { PositionCard } from "@/components/shareable/position-card";
import { PublicContentHeader } from "@/components/shareable/public-content-header";
import { PublicSiteFooter } from "@/components/shareable/public-site-footer";
import { getPublicPositions } from "@/lib/share/public-content";

export const metadata: Metadata = {
  title: "Explore positions",
  description: "Explore shareable positions connected to Guyana's local-content economy.",
};

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const positions = await getPublicPositions();

  return (
    <main id="main-content" className="min-h-screen bg-background">
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
            <div className="mt-6 rounded-lg border border-dashed border-border bg-surface p-6">
              <h3 className="text-lg font-semibold text-foreground">No public positions right now.</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted">You can still build a route from your interests and starting point, then return when new roles are published.</p>
              <Link href="/i-want-to-become" className="mt-4 inline-flex min-h-11 items-center font-semibold text-accent underline-offset-4 hover:underline">Build a career route <span aria-hidden="true" className="ml-2">→</span></Link>
            </div>
          )}
        </section>

        <p className="mx-auto mt-6 max-w-3xl text-sm leading-6 text-muted">
          Position details can change. Confirm the vacancy and requirements with
          the employer before deciding.
        </p>
        <PublicSiteFooter />
      </div>
    </main>
  );
}
