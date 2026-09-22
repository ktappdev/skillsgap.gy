import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main id="main-content" className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col justify-center">
        <Link href="/" className="mx-auto inline-flex min-h-11 items-center" aria-label="SkillsGap.gy home">
          <Image
            src="/skillsgap-logo.webp"
            alt="SkillsGap.gy"
            width={192}
            height={116}
            priority
            className="h-14 w-auto object-contain"
          />
        </Link>
        <section className="mt-6 rounded-lg border border-border bg-surface p-6 sm:p-8">{children}</section>
        <p className="mt-5 text-center text-sm text-muted">
          Explore without an account: <Link href="/opportunities" className="font-semibold text-accent underline-offset-4 hover:underline">positions</Link> · <Link href="/training" className="font-semibold text-accent underline-offset-4 hover:underline">training</Link> · <Link href="/i-want-to-become" className="font-semibold text-accent underline-offset-4 hover:underline">career routes</Link>
        </p>
      </div>
    </main>
  );
}
