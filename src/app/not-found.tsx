import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="grid min-h-screen place-items-center bg-background px-4 py-12">
      <section className="w-full max-w-md rounded-lg border border-border bg-surface p-6 text-center sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground">That page wandered off.</h1>
        <p className="mt-3 text-sm leading-6 text-muted">That page does not exist or is no longer available. Try one of these paths instead.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-strong">Go home</Link>
          <Link href="/opportunities" className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:border-accent hover:text-accent">Browse positions</Link>
        </div>
      </section>
    </main>
  );
}
