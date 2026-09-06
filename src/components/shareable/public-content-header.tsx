import Image from "next/image";
import Link from "next/link";

type PublicContentHeaderProps = {
  active?: "positions" | "training" | "faq";
};

const idleLink = "min-h-11 inline-flex items-center text-foreground hover:text-accent";
const activeLink = "min-h-11 inline-flex items-center text-accent";

export function PublicContentHeader({ active }: PublicContentHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <Link href="/" className="inline-flex min-h-11 items-center" aria-label="SkillsGap.gy home">
        <Image
          src="/skillsgap-logo.webp"
          alt="SkillsGap.gy"
          width={1200}
          height={728}
          priority
          className="h-7 w-auto object-contain sm:h-8"
        />
      </Link>
      <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-semibold" aria-label="Explore SkillsGap.gy">
        <Link
          href="/opportunities"
          className={active === "positions" ? activeLink : idleLink}
          aria-current={active === "positions" ? "page" : undefined}
        >
          Positions
        </Link>
        <Link
          href="/training"
          className={active === "training" ? activeLink : idleLink}
          aria-current={active === "training" ? "page" : undefined}
        >
          Training
        </Link>
        <Link href="/i-want-to-become" className={idleLink}>Build a route</Link>
        <Link
          href="/faq"
          className={active === "faq" ? activeLink : idleLink}
          aria-current={active === "faq" ? "page" : undefined}
        >
          FAQ
        </Link>
        <Link href="/login" className={`${idleLink} underline underline-offset-4`}>Sign in</Link>
      </nav>
    </header>
  );
}
