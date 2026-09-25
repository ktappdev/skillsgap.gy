import { ConsoleSkeleton } from "@/components/app/console-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

// Covers the company console: overview, roles, candidates, job fairs, and team.
// Width follows the overview landing page (max-w-6xl); the sub-pages are
// max-w-5xl, so they settle 64px narrower when their data lands. The group
// layout is synchronous and suspends the session read in <AppHeader />, so this
// paints on a cold navigation to /company.
export default function CompanyConsoleLoading() {
  return (
    <ConsoleSkeleton label="Loading the company workspace" width="wide" navTabs={5}>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Skeleton kind="panel" className="h-24" />
        <Skeleton kind="panel" className="h-24" />
        <Skeleton kind="panel" className="h-24" />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Skeleton kind="panel" className="h-40" />
        <Skeleton kind="panel" className="h-40" />
      </div>
    </ConsoleSkeleton>
  );
}
