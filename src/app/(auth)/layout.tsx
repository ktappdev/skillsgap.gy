import Link from "next/link";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
        <Link href="/" className="mx-auto flex items-center gap-3 font-semibold tracking-tight text-foreground">
          <span className="grid size-10 place-items-center bg-accent text-sm font-black text-white shadow-sm">
            SG
          </span>
          <span>skillsgap<span className="text-accent">.gy</span></span>
        </Link>
        <section className="mt-8 rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-8">{children}</section>
        <p className="mt-6 text-center text-xs leading-5 text-muted">
          A clearer route from experience to opportunity.
        </p>
      </div>
    </main>
  );
}
