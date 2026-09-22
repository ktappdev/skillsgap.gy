import Link from "next/link";

export type PathwayStep = Readonly<{
  label: string;
  detail: string;
  href: string;
  state: "complete" | "current" | "next";
}>;

export function PathwaySteps({ steps }: { steps: readonly PathwayStep[] }) {
  return (
    <nav className="border border-border bg-surface p-4" aria-label="Your pathway progress">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Your next steps</p>
        <p className="text-xs text-muted">Follow the route in order, or jump to what needs your attention.</p>
      </div>
      <ol className="mt-4 grid gap-2 md:grid-cols-4">
        {steps.map((step, index) => {
          const markerClass = step.state === "complete"
            ? "bg-accent text-white"
            : step.state === "current"
              ? "border-2 border-accent bg-surface text-accent"
              : "border border-border bg-surface-muted text-muted";
          return (
            <li key={step.label}>
              <Link href={step.href} aria-current={step.state === "current" ? "step" : undefined} className="group flex min-h-16 gap-3 rounded-md border border-transparent p-2 transition-colors hover:border-border hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                <span className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ${markerClass}`} aria-hidden="true">{step.state === "complete" ? "✓" : index + 1}</span>
                <span className="min-w-0">
                  <span className={`block text-sm font-semibold ${step.state === "current" ? "text-accent" : "text-foreground"}`}>{step.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted">{step.detail}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
