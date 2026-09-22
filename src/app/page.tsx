import type { Metadata } from "next";
import Link from "next/link";

import { HomeHero } from "@/components/home/home-hero";
import { PublicSiteFooter } from "@/components/shareable/public-site-footer";

export const metadata: Metadata = {
  title: "Find your next move",
  description: "Connect your skills with opportunities in Guyana. Find the qualifications and training to take your next career step.",
};

const productSteps = [
  { number: "01", title: "Start with your skills", description: "Upload your CV or add your experience. Review and confirm your skills before they are used for matching." },
  { number: "02", title: "Find your opportunities", description: "See how your confirmed experience meets local role requirements, and understand what is missing." },
  { number: "03", title: "Build what comes next", description: "Find training connected to the qualifications you need, with a clear next step toward your chosen role." },
];

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen bg-background">
      <HomeHero />
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <section id="how-it-works" className="scroll-mt-6 border-b border-border py-20 lg:py-28" aria-labelledby="how-it-works-title">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-16">
            <h2 id="how-it-works-title" className="max-w-lg text-3xl font-normal leading-tight sm:text-4xl">Local opportunity starts with the skills you have.</h2>
            <p className="max-w-xl text-lg leading-8 text-muted">SkillsGap.gy helps you make informed career decisions. From your first job to a new direction, see how your experience connects to work and training in Guyana.</p>
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
            <p className="text-sm font-semibold text-accent">Your next chapter</p>
            <h2 id="career-start-title" className="mt-6 max-w-md text-3xl font-normal leading-tight sm:text-4xl">Experience to build on.<br />A direction to work toward.</h2>
            <p className="mt-6 max-w-md text-base leading-7 text-muted">You don’t need an exact job title or a perfect CV to get started. Choose the starting point that fits you.</p>
          </div>
          <div className="divide-y divide-border border-y border-border">
            <article className="py-8">
              <h3 className="text-2xl font-semibold">I have experience</h3>
              <p className="mt-3 text-base leading-7 text-muted">Bring your work history and skills. Build a confirmed profile and find roles that match what you can do.</p>
              <Link href="/signup" className="mt-4 inline-flex min-h-11 items-center gap-4 font-semibold text-accent underline-offset-4 hover:underline">Build my profile <span aria-hidden="true">→</span></Link>
            </article>
            <article className="py-8">
              <h3 className="text-2xl font-semibold">I have a career in mind</h3>
              <p className="mt-3 text-base leading-7 text-muted">Start with your interests and CSEC/CXC subjects. Explore a direction and the steps that could take you there.</p>
              <Link href="/i-want-to-become" className="mt-4 inline-flex min-h-11 items-center gap-4 font-semibold text-accent underline-offset-4 hover:underline">Explore a route <span aria-hidden="true">→</span></Link>
            </article>
          </div>
        </section>
      </div>

      <section className="bg-surface-muted py-16" aria-labelledby="home-cta-title">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 lg:flex-row lg:items-center lg:justify-between lg:px-12">
          <div>
            <h2 id="home-cta-title" className="text-3xl font-normal">Explore what’s available.</h2>
            <p className="mt-3 text-base leading-7 text-muted">Browse local positions and training before you create a profile.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-4">
            <Link href="/opportunities" className="inline-flex min-h-12 items-center justify-center rounded-md bg-accent px-6 font-semibold text-white hover:bg-accent-strong">Browse positions</Link>
            <Link href="/training" className="inline-flex min-h-12 items-center justify-center rounded-md border border-accent px-6 font-semibold text-accent hover:bg-white">Find training</Link>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-6 lg:px-12"><PublicSiteFooter /></div>
    </main>
  );
}
