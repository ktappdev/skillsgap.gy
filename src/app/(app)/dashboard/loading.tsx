import { LoadingScreen } from "@/components/ui/loading-screen";
import { Skeleton } from "@/components/ui/skeleton";

// Outlines the current dashboard: a max-w-3xl single column that opens with the
// pathway header, then steps, the CV card, and the skills and matches stack.
// The earlier version drew a max-w-6xl two-column layout the page no longer
// renders, and jumped sideways when the data landed. The group layout is
// synchronous, so this paints on a cold navigation to the dashboard.
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <LoadingScreen label="Loading your pathway">
        <div className="border-b border-border pb-7">
          <Skeleton kind="line" className="h-3 w-32" />
          <Skeleton kind="line" className="mt-3 h-9 w-3/4 max-w-md sm:h-10" />
          <Skeleton kind="line" className="mt-3 h-4 w-full max-w-2xl" />
          <Skeleton kind="line" className="mt-2 h-4 w-2/3 max-w-xl" />
        </div>
        <Skeleton kind="panel" className="mt-6 h-32" />
        <Skeleton kind="panel" className="mt-8 h-64" />
        <Skeleton kind="panel" className="mt-8 h-72" />
      </LoadingScreen>
    </div>
  );
}
