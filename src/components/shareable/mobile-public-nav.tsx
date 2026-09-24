"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type MobilePublicNavProps = {
  appearance: "default" | "overlay";
  active?: "positions" | "training" | "faq";
  accountHref: string;
  accountLabel: string;
  showGetStarted: boolean;
  signOutControl?: ReactNode;
};

const navItems: Array<{ href: string; label: string; active?: "positions" | "training" | "faq" }> = [
  { href: "/opportunities", label: "Positions", active: "positions" },
  { href: "/training", label: "Training", active: "training" },
  { href: "/i-want-to-become", label: "Build a route", active: undefined },
  { href: "/faq", label: "FAQ", active: "faq" },
] as const;

export function MobilePublicNav({ appearance, active, accountHref, accountLabel, showGetStarted, signOutControl }: MobilePublicNavProps) {
  const [open, setOpen] = useState(false);
  const isOverlay = appearance === "overlay";

  useEffect(() => {
    if (!open) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const linkClass = isOverlay
    ? "flex min-h-11 items-center rounded-md px-3 text-white hover:bg-white/10"
    : "flex min-h-11 items-center rounded-md px-3 text-foreground hover:bg-surface-muted";
  const activeClass = isOverlay ? "bg-white/15 font-semibold" : "bg-surface-muted font-semibold text-accent";
  const menuClass = isOverlay
    ? "border-white/25 bg-foreground/95"
    : "border-border bg-surface";

  return (
    <div className="relative lg:hidden">
      <button
        type="button"
        className={isOverlay
          ? "inline-flex min-h-11 items-center gap-3 rounded-md border border-white/40 px-3 text-sm font-semibold text-white hover:bg-white/10"
          : "inline-flex min-h-11 items-center gap-3 rounded-md border border-border px-3 text-sm font-semibold text-foreground hover:bg-surface-muted"}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-controls="mobile-public-nav"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? "Close" : "Menu"}
        <span className="grid size-4 place-items-center" aria-hidden="true">
          {open ? <span className="text-lg leading-none">×</span> : <span className="text-base leading-none">☰</span>}
        </span>
      </button>

      {open ? (
        <nav id="mobile-public-nav" className={`absolute right-0 top-full z-10 mt-3 w-72 max-w-[calc(100vw-2rem)] rounded-lg border p-3 ${menuClass}`} aria-label="Mobile navigation">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${linkClass} ${item.active === active ? activeClass : ""}`}
                aria-current={item.active === active ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link href={accountHref} className={`${linkClass} underline underline-offset-4`} onClick={() => setOpen(false)}>
              {accountLabel}
            </Link>
            {signOutControl}
            {showGetStarted ? (
              <Link
                href="/signup"
                className={isOverlay
                  ? "mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-white px-4 text-sm font-semibold text-foreground hover:bg-surface-muted"
                  : "mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong"}
                onClick={() => setOpen(false)}
              >
                Get started
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
