import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 text-center shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground">That page wandered off.</h1>
        <p className="mt-3 text-sm leading-6 text-muted">That pathway does not exist or is no longer available.</p>
        <Link
          href="/"
          className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong"
        >
          Go home
        </Link>
      </section>
    </main>
  );
}
