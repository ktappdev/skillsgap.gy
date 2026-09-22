import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { HomeHero } from "@/components/home/home-hero";
import { PublicSiteFooter } from "@/components/shareable/public-site-footer";

export const metadata: Metadata = {
  title: "Find your next move",
  description: "Connect your skills with opportunities in Guyana. Find the qualifications and training to take your next career step.",
};

const productSteps = [
  { number: "01", title: "Start with your skills", description: "Add your CV or experience. Confirm your skills." },
  { number: "02", title: "Find your opportunities", description: "See roles that match, and what is missing." },
  { number: "03", title: "Build what comes next", description: "Find training for the qualifications you need." },
];

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen bg-background">
      <HomeHero />
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <section id="how-it-works" className="scroll-mt-6 border-b border-border py-20 lg:py-28" aria-labelledby="how-it-works-title">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-16">
            <h2 id="how-it-works-title" className="max-w-lg text-3xl font-normal leading-tight sm:text-4xl">Find your next move.</h2>
            <p className="max-w-xl text-lg leading-8 text-muted">See how your experience connects to work and training in Guyana.</p>
          </div>
          <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
            {productSteps.map((step) => (
              <li key={step.number} className="border-t border-border pt-6">
                <span className="text-sm font-semibold tabular-nums text-accent">{step.number}</span>
                <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-base leading-7 text-muted">{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-10 py-20 md:grid-cols-2 md:gap-16 lg:py-28" aria-labelledby="career-start-title">
          <div>
            <p className="text-sm font-semibold text-accent">Choose a starting point</p>
            <h2 id="career-start-title" className="mt-6 max-w-md text-3xl font-normal leading-tight sm:text-4xl">Build on your experience.<br />Choose a direction.</h2>
            <p className="mt-6 max-w-md text-base leading-7 text-muted">Start with the experience you have—or a career you want to explore.</p>
          </div>
          <div className="divide-y divide-border border-y border-border">
            <article className="py-8">
              <h3 className="text-2xl font-semibold">I have experience</h3>
              <p className="mt-3 text-base leading-7 text-muted">Find roles that match your skills.</p>
              <Link href="/signup" className="mt-4 inline-flex min-h-11 items-center gap-4 font-semibold text-accent underline-offset-4 hover:underline">Build my profile <span aria-hidden="true">→</span></Link>
            </article>
            <article className="py-8">
              <h3 className="text-2xl font-semibold">I have a career in mind</h3>
              <p className="mt-3 text-base leading-7 text-muted">Explore a career direction and the steps to get there.</p>
              <Link href="/i-want-to-become" className="mt-4 inline-flex min-h-11 items-center gap-4 font-semibold text-accent underline-offset-4 hover:underline">Explore a route <span aria-hidden="true">→</span></Link>
            </article>
          </div>
        </section>
      </div>

      <section className="relative isolate overflow-hidden bg-foreground py-20 text-white" aria-labelledby="home-cta-title">
        <Image
          src="/images/offshore-overhead.webp"
          alt=""
          fill
          sizes="100vw"
          className="-z-20 object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-black/60" aria-hidden="true" />
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 lg:flex-row lg:items-center lg:justify-between lg:px-12">
          <div>
            <h2 id="home-cta-title" className="text-3xl font-normal">See what’s available.</h2>
            <p className="mt-3 text-base leading-7 text-white/85">Browse positions and training.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-4">
            <Link href="/opportunities" className="inline-flex min-h-12 items-center justify-center rounded-md bg-white px-6 font-semibold text-foreground hover:bg-surface-muted">Browse positions</Link>
            <Link href="/training" className="inline-flex min-h-12 items-center justify-center rounded-md border border-white px-6 font-semibold text-white hover:bg-white/10">Find training</Link>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-6 lg:px-12"><PublicSiteFooter /></div>
    </main>
  );
}
