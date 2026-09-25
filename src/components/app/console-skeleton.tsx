import type { ReactNode } from "react";

import { LoadingScreen } from "@/components/ui/loading-screen";
import { Skeleton } from "@/components/ui/skeleton";

type ConsoleWidth = "narrow" | "standard" | "wide";

type ConsoleSkeletonProps = {
  /** Announced to screen readers, e.g. "Loading the company workspace". */
  label: string;
  /**
   * `narrow` (max-w-4xl) matches the applicant pages; `standard` (max-w-5xl) covers the
   * company, provider, and admin consoles; `wide` (max-w-6xl) matches the console landings.
   */
  width?: ConsoleWidth;
  /** Section tabs to outline below the heading; 0 for pages without ManagementNav. */
  navTabs?: number;
  children?: ReactNode;
};

// Width and vertical rhythm travel together because the real pages pair them:
// the max-w-4xl pages use py-6, the larger consoles use py-8.
const widthClasses: Record<ConsoleWidth, string> = {
  narrow: "max-w-4xl py-6",
  standard: "max-w-5xl py-8",
  wide: "max-w-6xl py-8",
};

/**
 * The signed-in console shell: heading, optional section tabs, then whatever
 * panels the caller outlines. Sits below the (app) layout, so it does not repeat
 * the header or the main landmark.
 */
export function ConsoleSkeleton({ label, width = "standard", navTabs = 0, children }: ConsoleSkeletonProps) {
  return (
    <div className={`mx-auto ${widthClasses[width]} px-4 sm:px-6 lg:px-8`}>
      <LoadingScreen label={label}>
        <Skeleton kind="line" className="h-8 w-64 max-w-full" />
        <Skeleton kind="line" className="mt-3 h-4 w-full max-w-2xl" />
        <Skeleton kind="line" className="mt-2 h-4 w-2/3 max-w-xl" />
        {navTabs > 0 ? (
          <div className="mt-6 flex gap-2 border-b border-border">
            {Array.from({ length: navTabs }, (_, index) => (
              <Skeleton key={`tab-${index + 1}`} kind="line" className="h-11 w-24" />
            ))}
          </div>
        ) : null}
        {children}
      </LoadingScreen>
    </div>
  );
}
