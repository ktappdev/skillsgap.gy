import { ConsoleSkeleton } from "@/components/app/console-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

// Covers the admin console: overview, companies, qualifications, training, and
// career guidance (5 section tabs). Width follows the overview landing page
// (max-w-6xl); the list sub-pages are max-w-5xl, so they settle 64px narrower
// when their data lands. The group layout is synchronous, so this paints on a
// cold navigation to the admin console.
export default function AdminConsoleLoading() {
  return (
    <ConsoleSkeleton label="Loading the admin console" width="wide" navTabs={5}>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Skeleton kind="panel" className="h-28" />
        <Skeleton kind="panel" className="h-28" />
        <Skeleton kind="panel" className="h-28" />
        <Skeleton kind="panel" className="h-28" />
      </div>
      <Skeleton kind="panel" className="mt-6 h-64" />
    </ConsoleSkeleton>
  );
}
