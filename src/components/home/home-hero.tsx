import Link from "next/link";

import { HeroBackdrop } from "@/components/home/hero-backdrop";
import { PublicContentHeader } from "@/components/shareable/public-content-header";

export function HomeHero() {
  return (
    <section className="home-hero relative isolate bg-foreground text-white" aria-labelledby="home-title">
      <HeroBackdrop />
      <div className="absolute inset-0 -z-10 bg-black/60" aria-hidden="true" />
      <div className="mx-auto flex min-h-svh max-w-7xl flex-col px-6 lg:px-12">
        <div className="border-b border-white/25 py-6">
          <PublicContentHeader appearance="overlay" />
        </div>
        <div className="flex flex-1 items-center py-20 sm:py-28 lg:py-32">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold">Skills. Careers. Guyana.</p>
            <h1 id="home-title" className="mt-6 text-5xl font-normal leading-tight sm:text-6xl lg:text-7xl">
              Your skills.<br />Guyana’s future.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/90">
              Find where your experience fits. Connect with local opportunities,
              understand the qualifications you need, and build your next step with training.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link href="/signup" className="inline-flex min-h-14 items-center justify-center gap-6 rounded-md bg-white px-6 font-semibold text-foreground hover:bg-surface-muted">
                Match my experience <span aria-hidden="true">→</span>
              </Link>
              <Link href="/i-want-to-become" className="inline-flex min-h-14 items-center gap-3 font-semibold text-white underline decoration-white/50 underline-offset-8 hover:decoration-white">
                Explore a career <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-white/25 py-6 text-sm">
          <a href="#how-it-works" className="inline-flex min-h-11 items-center gap-4 font-semibold hover:underline">
            A practical path forward <span aria-hidden="true">↓</span>
          </a>
          <p className="text-xs text-white/75">AI-generated offshore illustration</p>
        </div>
      </div>
    </section>
  );
}
