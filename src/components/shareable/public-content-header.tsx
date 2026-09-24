import Image from "next/image";
import Link from "next/link";

import { signOut } from "@/lib/auth/actions";
import { getCurrentUserHome } from "@/lib/auth/queries";
import { MobilePublicNav } from "@/components/shareable/mobile-public-nav";

type PublicContentHeaderProps = {
  appearance?: "default" | "overlay";
  active?: "positions" | "training" | "faq";
  accountHome?: string | null;
};

const idleLink = "min-h-11 inline-flex items-center text-foreground hover:text-accent";
const activeLink = "min-h-11 inline-flex items-center text-accent";

export async function PublicContentHeader({ appearance = "default", active, accountHome }: PublicContentHeaderProps) {
  const isOverlay = appearance === "overlay";
  const resolvedAccountHome = accountHome === undefined ? await getCurrentUserHome() : accountHome;
  const isSignedIn = resolvedAccountHome !== null;
  const accountHref = resolvedAccountHome ?? "/login";
  const accountLabel = resolvedAccountHome === "/dashboard" ? "My pathway" : isSignedIn ? "My account" : "Sign in";
  const linkClass = isOverlay ? "min-h-11 inline-flex items-center text-white hover:underline underline-offset-4" : idleLink;
  const signOutClass = `${linkClass} underline underline-offset-4`;
  const mobileSignOutClass = isOverlay
    ? "flex min-h-11 w-full items-center justify-start rounded-md px-3 text-left text-white underline underline-offset-4 hover:bg-white/10"
    : "flex min-h-11 w-full items-center justify-start rounded-md px-3 text-left text-foreground underline underline-offset-4 hover:bg-surface-muted";

  return (
    <header className="flex items-center justify-between gap-6">
      <Link href="/" className="inline-flex min-h-11 items-center gap-3" aria-label="SkillsGap.gy home">
        <Image
          src="/skillsgap-logo.webp"
          alt="SkillsGap.gy"
          width={1200}
          height={728}
          preload
          className={`h-7 w-auto object-contain sm:h-8 ${isOverlay ? "brightness-0 invert" : ""}`}
        />
      </Link>
      <div className={`hidden min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-1 lg:flex ${isOverlay ? "justify-end" : "justify-end"}`}>
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
        {isSignedIn ? (
          <form action={signOut}>
            <button type="submit" className={signOutClass}>Sign out</button>
          </form>
        ) : <Link href="/signup" className={`inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-semibold transition-colors ${isOverlay ? "bg-white text-foreground hover:bg-surface-muted" : "bg-accent text-white hover:bg-accent-strong"}`}>Get started</Link>}
      </div>
      <MobilePublicNav
        appearance={appearance}
        active={active}
        accountHref={accountHref}
        accountLabel={accountLabel}
        showGetStarted={!isSignedIn}
        signOutControl={isSignedIn ? (
          <form action={signOut} className="w-full">
            <button type="submit" className={mobileSignOutClass}>
              Sign out
            </button>
          </form>
        ) : null}
      />
    </header>
  );
}
