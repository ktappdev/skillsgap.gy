import Link from "next/link";

export function PublicSiteFooter() {
  return (
    <footer className="mt-16 border-t border-border py-8 text-sm text-muted">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-foreground">SkillsGap.gy</p>
          <p className="mt-1">Skills → opportunities → training</p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer navigation">
          <Link href="/opportunities" className="inline-flex min-h-11 items-center hover:text-accent hover:underline">Positions</Link>
          <Link href="/training" className="inline-flex min-h-11 items-center hover:text-accent hover:underline">Training</Link>
          <Link href="/i-want-to-become" className="inline-flex min-h-11 items-center hover:text-accent hover:underline">Build a route</Link>
          <Link href="/faq" className="inline-flex min-h-11 items-center hover:text-accent hover:underline">FAQ</Link>
          <Link href="/signup/provider" className="inline-flex min-h-11 items-center hover:text-accent hover:underline">For training providers</Link>
        </nav>
      </div>
    </footer>
  );
}
