import { ConsoleSkeleton } from "@/components/app/console-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

// Covers the provider console: overview and programs. The group layout is
// synchronous, so this paints on a cold navigation to the provider console.
export default function ProviderConsoleLoading() {
  return (
    <ConsoleSkeleton label="Loading the provider workspace" navTabs={2}>
      <Skeleton kind="panel" className="mt-6 h-72" />
    </ConsoleSkeleton>
  );
}
