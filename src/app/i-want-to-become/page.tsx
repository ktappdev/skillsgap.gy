import type { Metadata } from "next";
import Link from "next/link";

import { CareerExplorer } from "@/components/i-want-to-become/career-explorer";

export const metadata: Metadata = {
  title: "Build your career route",
  description: "Choose a career direction, add your CSEC/CXC starting point, and find practical next steps in Guyana.",
};

const promises = [
  ["01", "Choose a direction", "Start with the work you can see yourself learning."],
  ["02", "See what to build", "Turn your starting point into skills and preparation signals."],
  ["03", "Make a next move", "Leave with official places to learn, practise, or get guidance."],
] as const;

export default function IWantToBecomePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight text-foreground">
            <span className="grid size-9 place-items-center bg-accent text-sm font-black text-white">SG</span>
            <span>skillsgap<span className="text-accent">.gy</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-muted sm:inline">No CV required</span>
            <Link href="/login" className="text-sm font-semibold text-foreground underline-offset-4 hover:text-accent hover:underline">Sign in</Link>
          </div>
        </header>

        <section className="relative mt-8 overflow-hidden border border-foreground bg-foreground text-white" aria-labelledby="page-title">
          <div aria-hidden="true" className="absolute -right-16 -top-16 size-56 border-[24px] border-accent/30" />
          <div aria-hidden="true" className="absolute bottom-0 right-24 size-24 border border-white/10" />
          <div className="relative grid gap-10 p-6 sm:p-10 lg:grid-cols-[1.1fr_.9fr] lg:p-14">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">For school leavers and future talent</p>
              <h1 id="page-title" className="mt-5 max-w-xl text-4xl font-semibold leading-[1.04] tracking-[-0.055em] sm:text-6xl">Choose a future. Leave with a route.</h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">You do not need a CV to get started. Pick a direction, tell us what you bring, and get a practical pathway into Guyana&apos;s growing local-content economy.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a href="#career-explorer" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-5 text-sm font-semibold text-white transition hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300">Build my route <span aria-hidden="true" className="ml-2">↓</span></a>
                <Link href="/signup" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 px-5 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300">I already have experience</Link>
              </div>
            </div>

            <aside className="self-end border border-white/15 bg-white/5 p-5 sm:p-6" aria-label="What the pathway builder does">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">The pathway builder</p>
              <h2 className="mt-3 text-xl font-semibold tracking-tight">Useful before you feel ready.</h2>
              <div className="mt-6 space-y-5">
                <PathwayPromise number="01" title="Your direction" detail="A role you choose—not a score we invent." />
                <PathwayPromise number="02" title="Your starting point" detail="Subjects, interests, and strengths kept in context." />
                <PathwayPromise number="03" title="Your next move" detail="Three concrete actions with official links." />
              </div>
              <div className="mt-7 grid grid-cols-3 gap-px border border-white/10 bg-white/10 text-center">
                <HeroStat value="24" label="routes" />
                <HeroStat value="3" label="next moves" />
                <HeroStat value="0" label="CV needed" />
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-10 grid gap-px border border-border bg-border md:grid-cols-3" aria-label="How the pathway builder works">
          {promises.map(([number, title, description]) => <article key={number} className="bg-surface p-5 sm:p-6"><p className="text-xs font-bold tracking-[0.18em] text-accent">{number}</p><h2 className="mt-7 text-lg font-semibold tracking-tight text-foreground">{title}</h2><p className="mt-2 text-sm leading-6 text-muted">{description}</p></article>)}
        </section>

        <div className="mt-12">
          <CareerExplorer />
        </div>

        <p className="mx-auto mt-6 max-w-3xl text-center text-sm leading-6 text-muted">Career and training information is curated for this SkillsGap.gy demonstration. Confirm current entry requirements directly with a guidance counsellor, provider, or employer.</p>
        <footer className="flex flex-col gap-2 py-8 text-sm text-muted sm:flex-row sm:justify-between"><span>SkillsGap.gy</span><span>Skills → opportunities → training</span></footer>
      </div>
    </main>
  );
}

function PathwayPromise({ number, title, detail }: { number: string; title: string; detail: string }) {
  return <div className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center border border-teal-300/40 text-xs font-bold text-teal-300">{number}</span><div><p className="font-semibold text-white">{title}</p><p className="mt-1 text-sm leading-5 text-slate-300">{detail}</p></div></div>;
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return <div className="bg-foreground px-2 py-3"><p className="text-lg font-semibold text-white">{value}</p><p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p></div>;
}
