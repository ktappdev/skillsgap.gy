import type { Metadata } from "next";

import { PositionDirectory } from "@/components/shareable/position-directory";
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

        <PositionDirectory positions={positions} />

        <p className="mx-auto mt-6 max-w-3xl text-sm leading-6 text-muted">
          Position details can change. Confirm the vacancy and requirements with
          the employer before deciding.
        </p>
        <PublicSiteFooter />
      </div>
    </main>
  );
}
