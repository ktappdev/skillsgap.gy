import { ConsoleSkeleton } from "@/components/app/console-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

// Group fallback for the (app) pages that do not ship their own skeleton —
// today /interviews and /matches/[matchId], both max-w-4xl py-6 (the narrow
// width) — and any (app) page added later. The group layout is synchronous and
// suspends the session read inside <AppHeader />, so this paints on a cold
// navigation to those routes; in-page waits report themselves from their own
// components.
export default function AppLoading() {
  return (
    <ConsoleSkeleton label="Loading your workspace" width="narrow">
      <div className="mt-6 space-y-4">
        <Skeleton kind="panel" className="h-32" />
        <Skeleton kind="panel" className="h-32" />
      </div>
    </ConsoleSkeleton>
  );
}
