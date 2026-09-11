import Image from "next/image";
import Link from "next/link";

const productSteps = [
  {
    number: "01",
    title: "Recognize your experience",
    description: "Turn the work you have already done into a clear skills profile.",
  },
  {
    number: "02",
    title: "Find your closest opportunities",
    description: "See how your strengths line up with real roles in Guyana.",
  },
  {
    number: "03",
    title: "Close the gaps",
    description: "Get pointed toward training that helps you take the next step.",
  },
];

function Tape({ position }: { position: "top" | "bottom" }) {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-x-0 z-10 overflow-hidden border-y-2 border-foreground bg-accent/70 py-4 ${position === "top" ? "top-24 -rotate-2" : "bottom-12 rotate-2"}`}
    >
      <div className="flex min-w-max -translate-x-6 items-center text-xs font-black uppercase tracking-[0.2em] text-white sm:text-sm">
        {Array.from({ length: 8 }, (_, index) => (
          <span key={index} className="border-r border-white/50 px-6 py-2">
            Under construction&nbsp; ◆
          </span>
        ))}
      </div>
    </div>
  );
}

function SecondPlaceTrophy() {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="relative mx-auto flex items-center justify-center">
        <span className="grid size-40 place-items-center rounded-full border-8 border-yellow-400/60 bg-gradient-to-b from-yellow-300 to-amber-500 text-7xl shadow-lg shadow-amber-900/20 sm:size-48 sm:text-8xl" aria-hidden="true">
          🥈
        </span>
        <span className="absolute -top-2 -right-2 grid size-10 place-items-center rounded-full border-4 border-yellow-400/60 bg-gradient-to-b from-yellow-300 to-amber-500 text-2xl shadow-md" aria-hidden="true">
          ✦
        </span>
        <span className="absolute -bottom-3 -left-3 -z-10 grid size-16 place-items-center rounded-full border-4 border-yellow-400/60 bg-gradient-to-b from-yellow-300 to-amber-500 text-2xl shadow-md" aria-hidden="true">
          ✦
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <Tape position="top" />
      <Tape position="bottom" />

      <div className="relative z-20 mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <div className="inline-flex min-h-11 items-center" aria-label="SkillsGap.gy">
            <Image
              src="/skillsgap-logo.webp"
              alt="SkillsGap.gy"
              width={120}
              height={73}
              priority
              className="h-8 w-auto object-contain"
            />
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/faq" className="inline-flex min-h-11 items-center text-sm font-semibold text-foreground underline-offset-4 hover:text-accent hover:underline">
              FAQ
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-accent">
              <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
              In development
            </span>
          </div>
        </header>

        <section className="flex flex-1 items-center py-20 sm:py-24 lg:py-28" aria-labelledby="coming-soon-title">
          <div className="grid w-full items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            <div>
              <div className="inline-flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-accent">
                <span aria-hidden="true" className="text-base leading-none">⚒</span>
                Under construction
              </div>
              <div className="mt-6">
                <SecondPlaceTrophy />
                <p className="mt-6 text-center text-sm font-bold uppercase tracking-[0.2em] text-foreground">
                  Innovation Challenge 2026 · Guyana
                </p>
              </div>
              <h1 id="coming-soon-title" className="mt-8 max-w-3xl text-5xl font-semibold leading-[0.98] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                A better way to move from skills to opportunity is on the way.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
                SkillsGap.gy is a Guyana-focused career transition platform. It
                helps people see the experience they already have, match it to
                real local opportunities, understand what is missing, and find
                training to close the gap.
              </p>
              <p className="mt-6 max-w-xl border-l-2 border-accent pl-4 text-sm font-semibold leading-6 text-foreground">
                We took second place and are now rebuilding the next chapter
                properly. SkillsGap.gy is under construction — coming back bigger
                and better.
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">
              <div className="border border-border bg-surface p-5 sm:p-6">
                <div className="flex items-start justify-between gap-6 border-b border-border pb-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">What we are building</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">What we are building</h2>
                  <p className="mt-1 text-sm text-muted">Recognition first, then the real work.</p>
                  </div>
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-surface-muted text-2xl" aria-hidden="true">🦺</span>
                </div>
                <ol className="divide-y divide-border">
                  {productSteps.map((step) => (
                    <li key={step.number} className="flex gap-4 py-5 last:pb-1">
                      <span className="text-sm font-black text-accent">{step.number}</span>
                      <div>
                        <h3 className="font-semibold text-foreground">{step.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-muted">{step.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="absolute -bottom-4 -left-4 -z-10 size-20 border-b-2 border-l-2 border-accent" aria-hidden="true" />
              <div className="absolute -right-4 -top-4 -z-10 size-20 border-r-2 border-t-2 border-accent" aria-hidden="true" />
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t border-border py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>SkillsGap.gy</span>
          <span>Skills → opportunities → training</span>
        </footer>
      </div>
    </main>
  );
}
