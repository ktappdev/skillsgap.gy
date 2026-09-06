import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col justify-center">
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
        <section className="mt-6 rounded-lg border border-border bg-surface p-6">{children}</section>
      </div>
    </main>
  );
}
