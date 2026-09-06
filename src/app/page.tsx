import Image from "next/image";
import Link from "next/link";

const routes = [
  {
    title: "Tell us what you've done",
    description: "Upload a CV. We'll pull out the skills that already count.",
  },
  {
    title: "See roles that already fit",
    description: "Compare your confirmed experience with local opportunities.",
  },
  {
    title: "Get the next piece of training",
    description: "Close one gap at a time with a verified local course.",
  },
];

const examplePathway = [
  {
    stage: "What already counts",
    title: "Mechanical experience",
    detail: "4 years of mechanical maintenance",
  },
  {
    stage: "A focused next step",
    title: "Hydraulics training",
    detail: "A local maintenance course at GTI",
  },
  {
    stage: "Where it can lead",
    title: "Offshore technician",
    detail: "With BOSIET certification before offshore work",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2"
            aria-label="SkillsGap.gy home"
          >
            <Image
              src="/skillsgap-logo.webp"
              alt="SkillsGap.gy"
              width={120}
              height={73}
              priority
              className="h-8 w-auto object-contain"
            />
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-foreground underline-offset-4 hover:text-accent hover:underline"
          >
            Sign in
          </Link>
        </header>

        <section className="flex flex-1 flex-col justify-center py-12 lg:py-16">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              Built for Guyana&apos;s local talent
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Your experience can take you further than you think.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">
              SkillsGap.gy helps Guyanese citizens build the skills they need
              for careers in the rapidly growing energy industry.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/signup"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-5 font-semibold text-white transition hover:bg-accent-strong"
              >
                I have experience
              </Link>
              <Link
                href="/i-want-to-become"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-accent bg-surface px-5 font-semibold text-accent transition hover:bg-surface-muted"
              >
                I want to become…
              </Link>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">
              Start with a CV, or explore a route from your CSEC/CXC results.
            </p>
          </div>

          <section
            aria-label="Example skills pathway"
            className="mt-12 border-y border-border bg-surface"
          >
            <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-accent">
                  Example route
                </span>
                <h2 className="font-semibold tracking-tight text-foreground">
                  From mechanic to offshore technician
                </h2>
              </div>
              <p className="text-sm text-muted">Experience → training → opportunity</p>
            </div>
            <ol className="grid md:grid-cols-3">
              {examplePathway.map((step, index) => (
                <li
                  key={step.stage}
                  className="relative border-b border-border px-5 py-6 last:border-b-0 md:border-b-0 md:border-r md:px-6 md:last:border-r-0"
                >
                  <div className="flex items-start gap-4">
                    <span
                      aria-hidden="true"
                      className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-white"
                    >
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-accent">{step.stage}</p>
                      <h3 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-muted">{step.detail}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <div className="flex flex-col gap-3 border-b border-border py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-x-5 gap-y-1 font-semibold text-accent">
              <Link href="/opportunities" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
                Explore positions <span aria-hidden="true">→</span>
              </Link>
              <Link href="/training" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
                Find training <span aria-hidden="true">→</span>
              </Link>
            </div>
            <p className="leading-6 text-muted">
              <Link href="/signup/company" className="font-semibold text-accent underline-offset-4 hover:underline">
                Hiring? Join as a company
              </Link>{" "}
              ·{" "}
              <Link href="/signup/provider" className="font-semibold text-accent underline-offset-4 hover:underline">
                Offer training
              </Link>
            </p>
          </div>
        </section>

        <section className="grid gap-px border border-border bg-border md:grid-cols-3" aria-label="How it works">
          {routes.map((route) => (
            <article key={route.title} className="bg-surface p-5 sm:p-6">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">{route.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{route.description}</p>
            </article>
          ))}
        </section>

        <footer className="flex flex-col gap-2 py-6 text-sm text-muted sm:flex-row sm:justify-between">
          <span>SkillsGap.gy</span>
          <span>Skills → opportunities → training</span>
        </footer>
      </div>
    </main>
  );
}
