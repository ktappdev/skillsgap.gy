import Link from "next/link";

const steps = [
  ["01", "Your experience", "Upload a CV and tell us what you have done."],
  ["02", "Your closest routes", "See roles where your skills already count."],
  ["03", "A practical next step", "Close only the gaps that matter, with local training."],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Brand />
          <Link href="/login" className="text-sm font-semibold text-foreground underline-offset-4 hover:text-accent hover:underline">Sign in</Link>
        </header>
        <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.08fr_.92fr] lg:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Built for Guyana&apos;s local talent</p>
            <h1 className="mt-4 max-w-xl text-5xl font-semibold leading-[1.03] tracking-[-0.05em] text-foreground sm:text-6xl">Your experience can take you further than you think.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
              SkillsGap.gy finds your closest oil-and-gas career routes, explains what you already bring, and shows the training that can get you there.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/signup" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-5 font-semibold text-white transition hover:bg-accent-strong">I have experience</Link>
              <Link href="/i-want-to-become" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-accent bg-surface px-5 font-semibold text-accent transition hover:bg-teal-50">I want to become…</Link>
              <Link href="/signup/company" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-surface px-5 font-semibold text-foreground transition hover:border-accent hover:text-accent">I represent a company</Link>
              <Link href="/signup/provider" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-surface px-5 font-semibold text-foreground transition hover:border-accent hover:text-accent">I offer training</Link>
            </div>
            <p className="mt-4 text-sm text-muted">Start with a CV, or explore a career route from your CSEC/CXC results. No job title required.</p>
          </div>
          <section aria-label="Example skills pathway" className="border border-border bg-surface p-5 shadow-sm sm:p-7">
            <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">A clearer route</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">From mechanic to offshore technician</h2>
              </div>
              <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold text-accent">65% match</span>
            </div>
            <div className="space-y-4 py-6 text-sm"><PathRow label="Strength recognized" detail="4 years mechanical maintenance" done /><PathRow label="One training route" detail="Hydraulics maintenance at GTI" /><PathRow label="Required before offshore work" detail="BOSIET certification" /></div>
            <div className="border-t border-border pt-5">
              <p className="text-sm font-semibold text-foreground">We do not just say what is missing.</p>
              <p className="mt-1 text-sm leading-6 text-muted">We show the shortest credible next step and celebrate every bit of real progress.</p>
            </div>
          </section>
        </section>
        <section className="grid gap-px border border-border bg-border md:grid-cols-3">
          {steps.map(([number, title, description]) => (
            <article key={number} className="bg-surface p-5 sm:p-6">
              <p className="text-xs font-bold tracking-[0.18em] text-accent">{number}</p><h2 className="mt-8 text-lg font-semibold tracking-tight text-foreground">{title}</h2><p className="mt-2 text-sm leading-6 text-muted">{description}</p>
            </article>
          ))}
        </section>
        <footer className="flex flex-col gap-2 py-6 text-sm text-muted sm:flex-row sm:justify-between"><span>SkillsGap.gy</span><span>Skills → opportunities → training</span></footer>
      </div>
    </main>
  );
}

function Brand() { return <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight text-foreground"><span className="grid size-9 place-items-center bg-accent text-sm font-black text-white">SG</span><span>skillsgap<span className="text-accent">.gy</span></span></Link>; }
function PathRow({ label, detail, done = false }: { label: string; detail: string; done?: boolean }) { return <div className="flex gap-3"><span aria-hidden="true" className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-xs font-bold ${done ? "bg-accent text-white" : "border border-accent text-accent"}`}>{done ? "✓" : "→"}</span><div><p className="font-semibold text-foreground">{label}</p><p className="mt-0.5 text-muted">{detail}</p></div></div>; }
