import Image from "next/image";
import Link from "next/link";

type PublicContentHeaderProps = {
  appearance?: "default" | "overlay";
  active?: "positions" | "training" | "faq";
  accountHref?: string;
  accountLabel?: string;
  showGetStarted?: boolean;
};

const idleLink = "min-h-11 inline-flex items-center text-foreground hover:text-accent";
const activeLink = "min-h-11 inline-flex items-center text-accent";

export function PublicContentHeader({ appearance = "default", active, accountHref = "/login", accountLabel = "Sign in", showGetStarted = true }: PublicContentHeaderProps) {
  const isOverlay = appearance === "overlay";
  const linkClass = isOverlay ? "min-h-11 inline-flex items-center text-white hover:underline underline-offset-4" : idleLink;

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <Link href="/" className="inline-flex min-h-11 items-center gap-3" aria-label="SkillsGap.gy home">
        <Image
          src="/skillsgap-logo.webp"
          alt="SkillsGap.gy"
          width={1200}
          height={728}
          preload
          className={`h-7 w-auto object-contain sm:h-8 ${isOverlay ? "brightness-0 invert" : ""}`}
        />
        {isOverlay ? <span className="text-xl font-semibold text-white sm:text-2xl">SkillsGap.gy</span> : null}
      </Link>
      <div className={`flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-1 ${isOverlay ? "basis-full justify-start lg:basis-auto lg:justify-end" : "justify-end"}`}>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-semibold" aria-label="Explore SkillsGap.gy">
          <Link
            href="/opportunities"
            className={active === "positions" ? activeLink : linkClass}
            aria-current={active === "positions" ? "page" : undefined}
          >
            Positions
          </Link>
          <Link
            href="/training"
            className={active === "training" ? activeLink : linkClass}
            aria-current={active === "training" ? "page" : undefined}
          >
            Training
          </Link>
          <Link href="/i-want-to-become" className={linkClass}>Build a route</Link>
          <Link
            href="/faq"
            className={active === "faq" ? activeLink : linkClass}
            aria-current={active === "faq" ? "page" : undefined}
          >
            FAQ
          </Link>
        </nav>
        <Link href={accountHref} className={`${linkClass} underline underline-offset-4`}>{accountLabel}</Link>
        {showGetStarted ? <Link href="/signup" className={`inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-semibold transition-colors ${isOverlay ? "bg-white text-foreground hover:bg-surface-muted" : "bg-accent text-white hover:bg-accent-strong"}`}>Get started</Link> : null}
      </div>
    </header>
  );
}
