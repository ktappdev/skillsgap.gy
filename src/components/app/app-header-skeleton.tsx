import { Skeleton } from "@/components/ui/skeleton";

/**
 * Suspense fallback for the signed-in app header. Same outer geometry as the
 * real header — border, surface, min-h-16 row, max-w-6xl container, py-3, and
 * the md breakpoint between the inline nav and the second mobile row — so the
 * session resolving swaps the placeholders without a jump. Placeholder counts
 * follow the applicant space (six nav items), the largest and most common
 * session shape.
 */
export function AppHeaderSkeleton() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Skeleton kind="line" className="h-10 w-16 sm:h-11 sm:w-18" />
        <div className="hidden items-center gap-6 md:flex">
          <Skeleton kind="line" className="h-4 w-16" />
          <Skeleton kind="line" className="h-4 w-20" />
          <Skeleton kind="line" className="h-4 w-16" />
          <Skeleton kind="line" className="h-4 w-14" />
          <Skeleton kind="line" className="h-4 w-24" />
          <Skeleton kind="line" className="h-4 w-16" />
        </div>
        <Skeleton kind="line" className="h-11 w-24" />
      </div>
      <div className="border-t border-border md:hidden">
        <div className="mx-auto flex min-h-11 max-w-6xl items-center gap-6 overflow-x-auto px-4 py-1 sm:px-6">
          <Skeleton kind="line" className="h-4 w-16" />
          <Skeleton kind="line" className="h-4 w-20" />
          <Skeleton kind="line" className="h-4 w-16" />
        </div>
      </div>
    </header>
  );
}
