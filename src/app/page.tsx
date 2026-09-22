import type { Metadata } from "next";
import Link from "next/link";

import { PublicContentHeader } from "@/components/shareable/public-content-header";
import { PublicSiteFooter } from "@/components/shareable/public-site-footer";

export const metadata: Metadata = {
  title: "Find your next move",
  description: "Turn the experience you already have into a practical career route through Guyana's local-content opportunities.",
};

const productSteps = [
  {
    number: "01",
    title: "Recognize your experience",
    description: "Upload a private CV or start with the skills, interests, and results you already have.",
  },
  {
    number: "02",
    title: "See your closest routes",
    description: "Compare your confirmed profile with real roles and understand what is already working in your favour.",
  },
  {
    number: "03",
    title: "Close the gaps that matter",
    description: "Follow practical training and preparation steps connected to the opportunity in front of you.",
  },
];

const trustPoints = [
  {
    title: "You stay in control",
    description: "CV suggestions are only used for matching after you review and confirm them.",
  },
  {
    title: "The score has a reason",
    description: "Every route shows transferable strengths, missing requirements, and the next useful step.",
  },
  {
    title: "The pathway is local",
    description: "Opportunities and training are shaped around Guyana's workforce and local-content context.",
  },
];

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen overflow-hidden bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <PublicContentHeader />

        <section className="grid items-center gap-12 border-b border-border py-16 sm:py-20 lg:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)] lg:gap-20 lg:py-28" aria-labelledby="home-title">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-surface-muted px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-accent">
              <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
              Guyana-focused career pathways
            </p>
            <h1 id="home-title" className="mt-6 max-w-3xl text-5xl font-semibold leading-[0.98] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Your next move can start with the experience you already have.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
              SkillsGap.gy connects your skills to real local opportunities, explains the gaps that matter, and points you toward training that can help you move forward.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="inline-flex min-h-12 items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-strong">
                I have experience <span aria-hidden="true" className="ml-2">→</span>
              </Link>
              <Link href="/i-want-to-become" className="inline-flex min-h-12 items-center justify-center rounded-md border border-border bg-surface px-5 text-sm font-semibold text-foreground transition-colors hover:border-accent hover:text-accent">
                I want to become…
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted">No exact job title required. No perfect CV required to start exploring.</p>
          </div>

          <div className="relative" aria-label="The SkillsGap.gy pathway" role="img">
            <div className="border border-accent bg-accent p-6 text-white sm:p-8">
              <div className="flex items-start justify-between gap-4 border-b border-white/20 pb-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">One clear loop</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Skills to opportunity</h2>
                </div>
                <span className="grid size-12 shrink-0 place-items-center rounded-full border border-white/30 text-xl" aria-hidden="true">↗</span>
              </div>
              <ol className="divide-y divide-white/20">
                {productSteps.map((step) => (
                  <li key={step.number} className="flex gap-4 py-5 last:pb-1">
                    <span className="text-sm font-black text-white/70">{step.number}</span>
                    <div>
                      <h3 className="font-semibold">{step.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-white/75">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="absolute -bottom-4 -left-4 -z-10 size-20 border-b-2 border-l-2 border-accent" aria-hidden="true" />
            <div className="absolute -right-4 -top-4 -z-10 size-20 border-r-2 border-t-2 border-accent" aria-hidden="true" />
          </div>
        </section>

        <section className="border-b border-border py-16 sm:py-20" aria-labelledby="how-it-works-title">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">How it works</p>
            <h2 id="how-it-works-title" className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">A pathway that meets you where you are.</h2>
            <p className="mt-4 text-base leading-7 text-muted">Start with evidence from your work, or start with a direction you want to explore. Both paths lead to a practical next step.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <article className="border border-border bg-surface p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">For experienced workers</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">“I know what I can do.”</h3>
              <p className="mt-3 text-sm leading-7 text-muted">Upload your CV, review the skills we find, and see which opportunities are closest to your confirmed experience.</p>
              <Link href="/signup" className="mt-6 inline-flex min-h-11 items-center font-semibold text-accent underline-offset-4 hover:underline">Build my profile <span aria-hidden="true" className="ml-2">→</span></Link>
            </article>
            <article className="border border-border bg-surface p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">For future workers</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">“I know where I want to go.”</h3>
              <p className="mt-3 text-sm leading-7 text-muted">Choose a direction, add your interests and CSEC/CXC starting point, and leave with three honest next moves.</p>
              <Link href="/i-want-to-become" className="mt-6 inline-flex min-h-11 items-center font-semibold text-accent underline-offset-4 hover:underline">Explore a route <span aria-hidden="true" className="ml-2">→</span></Link>
            </article>
          </div>
        </section>

        <section className="py-16 sm:py-20" aria-labelledby="trust-title">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Built for real decisions</p>
              <h2 id="trust-title" className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Useful enough to act on. Honest enough to trust.</h2>
            </div>
            <ul className="divide-y divide-border border-y border-border" role="list">
              {trustPoints.map((point) => (
                <li key={point.title} className="flex gap-4 py-5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-muted text-sm font-bold text-accent" aria-hidden="true">✓</span>
                  <div>
                    <h3 className="font-semibold text-foreground">{point.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted">{point.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border border-accent bg-surface-muted p-6 sm:p-8 lg:flex lg:items-center lg:justify-between lg:gap-8" aria-labelledby="home-cta-title">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Start with one decision</p>
            <h2 id="home-cta-title" className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Do you want to match your experience or explore a direction?</h2>
          </div>
          <div className="mt-6 flex shrink-0 flex-wrap gap-3 lg:mt-0">
            <Link href="/opportunities" className="inline-flex min-h-11 items-center justify-center rounded-md border border-accent bg-surface px-4 text-sm font-semibold text-accent hover:bg-white">Browse positions</Link>
            <Link href="/training" className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong">Find training</Link>
          </div>
        </section>

        <PublicSiteFooter />
      </div>
    </main>
  );
}
