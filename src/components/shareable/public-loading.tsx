import type { ReactNode } from "react";

import { LoadingScreen } from "@/components/ui/loading-screen";
import { Skeleton } from "@/components/ui/skeleton";

type PublicPageSkeletonProps = {
  /** Announced to screen readers, e.g. "Loading open positions". */
  label: string;
  children: ReactNode;
};

/**
 * Public pages draw their own header and footer inside the page, so the skeleton
 * has to as well. Same container width and padding as the real pages, which keeps
 * the swap from shifting sideways.
 */
export function PublicPageSkeleton({ label, children }: PublicPageSkeletonProps) {
  return (
    <main id="main-content" className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6">
          <Skeleton kind="line" className="h-7 w-32 sm:h-8" />
          <div className="hidden items-center gap-5 lg:flex">
            <Skeleton kind="line" className="h-4 w-16" />
            <Skeleton kind="line" className="h-4 w-16" />
            <Skeleton kind="line" className="h-4 w-20" />
            <Skeleton kind="line" className="h-4 w-10" />
            <Skeleton kind="line" className="h-11 w-28" />
          </div>
          <Skeleton kind="line" className="h-11 w-24 lg:hidden" />
        </div>
        <LoadingScreen label={label}>{children}</LoadingScreen>
        <footer className="mt-16 border-t border-border py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Skeleton kind="line" className="h-4 w-28" />
              <Skeleton kind="line" className="mt-2 h-4 w-44" />
            </div>
            <Skeleton kind="line" className="h-4 w-72 max-w-full" />
          </div>
        </footer>
      </div>
    </main>
  );
}

/** The kicker, display heading, and intro paragraph every public page opens with. */
export function PublicHeroSkeleton() {
  return (
    <section className="mt-6 max-w-3xl">
      <Skeleton kind="line" className="h-3 w-24" />
      <Skeleton kind="line" className="mt-3 h-10 w-full max-w-lg sm:h-12" />
      <Skeleton kind="line" className="mt-6 h-5 w-full max-w-2xl" />
      <Skeleton kind="line" className="mt-2 h-5 w-4/5 max-w-xl" />
    </section>
  );
}

type DirectorySkeletonProps = {
  /** Result cards to outline. */
  rows?: number;
};

/** Mirrors PositionDirectory and CourseDirectory: heading, count, search, then result cards. */
export function DirectorySkeleton({ rows = 3 }: DirectorySkeletonProps) {
  return (
    <section className="mt-12">
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Skeleton kind="line" className="h-7 w-48" />
          <Skeleton kind="line" className="mt-2 h-4 w-32" />
        </div>
        <div className="w-full sm:max-w-xs">
          <Skeleton kind="line" className="h-4 w-28" />
          <Skeleton kind="line" className="mt-2 h-11 w-full" />
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {Array.from({ length: rows }, (_, index) => (
          <div key={`result-${index + 1}`} className="rounded-lg border border-border bg-surface p-5">
            <Skeleton kind="line" className="h-4 w-40" />
            <Skeleton kind="line" className="mt-3 h-6 w-2/3 max-w-sm" />
            <Skeleton kind="line" className="mt-2 h-4 w-32" />
            <Skeleton kind="line" className="mt-4 h-4 w-full" />
            <Skeleton kind="line" className="mt-2 h-4 w-5/6" />
            <Skeleton kind="line" className="mt-6 h-11 w-40" />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Mirrors the position and course detail pages: display heading, meta line, main column, side column. */
export function DetailSkeleton() {
  return (
    <>
      <section className="mt-6 max-w-3xl">
        <Skeleton kind="line" className="h-5 w-40" />
        <Skeleton kind="line" className="mt-3 h-10 w-full sm:h-12" />
        <Skeleton kind="line" className="mt-3 h-5 w-56" />
        <Skeleton kind="line" className="mt-2 h-4 w-64 max-w-full" />
        <div className="mt-6 flex flex-wrap gap-3">
          <Skeleton kind="line" className="h-11 w-40" />
          <Skeleton kind="line" className="h-11 w-44" />
        </div>
      </section>
      <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <Skeleton kind="panel" className="h-44" />
          <Skeleton kind="panel" className="h-64" />
        </div>
        <div className="space-y-6">
          <Skeleton kind="panel" className="h-40" />
          <Skeleton kind="panel" className="h-48" />
        </div>
      </div>
    </>
  );
}
