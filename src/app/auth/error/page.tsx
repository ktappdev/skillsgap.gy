import Link from "next/link";

type AuthErrorPageProps = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { reason } = await searchParams;
  const isRecoveryError = reason === "recovery";

  return (
    <main id="main-content" className="grid min-h-screen place-items-center bg-background px-4 py-12">
      <section className="w-full max-w-md rounded-lg border border-border bg-surface p-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {isRecoveryError ? "That reset link expired." : "That link did not work."}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          {isRecoveryError
            ? "Request a fresh reset link and use the newest email."
            : "The confirmation link may have expired. Start again for a fresh one."}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={isRecoveryError ? "/forgot-password" : "/login"}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
          >
            {isRecoveryError ? "Request a new link" : "Return to sign in"}
          </Link>
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
