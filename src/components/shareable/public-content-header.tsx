import Link from "next/link";

type PublicContentHeaderProps = {
  active?: "positions" | "training";
};

export function PublicContentHeader({ active }: PublicContentHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight text-foreground">
        <span className="grid size-9 place-items-center bg-accent text-sm font-black text-white">SG</span>
        <span>skillsgap<span className="text-accent">.gy</span></span>
      </Link>
      <nav className="flex flex-wrap items-center gap-4 text-sm font-semibold" aria-label="Explore SkillsGap.gy">
        <Link
          href="/opportunities"
          className={active === "positions" ? "text-accent" : "text-foreground hover:text-accent"}
          aria-current={active === "positions" ? "page" : undefined}
        >
          Positions
        </Link>
        <Link
          href="/training"
          className={active === "training" ? "text-accent" : "text-foreground hover:text-accent"}
          aria-current={active === "training" ? "page" : undefined}
        >
          Training
        </Link>
        <Link href="/i-want-to-become" className="text-foreground hover:text-accent">Build a route</Link>
        <Link href="/login" className="text-foreground underline-offset-4 hover:text-accent hover:underline">Sign in</Link>
      </nav>
    </header>
  );
}
