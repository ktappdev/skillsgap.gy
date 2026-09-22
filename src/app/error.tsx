"use client";

import Link from "next/link";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <main id="main-content" className="grid min-h-screen place-items-center bg-background px-4 py-12">
      <section className="w-full max-w-md rounded-lg border border-border bg-surface p-6 text-center sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-danger">Unexpected error</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground">Let&apos;s try that again.</h1>
        <p className="mt-3 text-sm leading-6 text-muted">The page hit a temporary problem while loading your pathway. Try again in a moment.</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            Go home
          </Link>
        </div>
      </section>
    </main>
  );
}
