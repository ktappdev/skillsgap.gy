import { DirectorySkeleton, PublicPageSkeleton } from "@/components/shareable/public-loading";
import { Skeleton } from "@/components/ui/skeleton";

export default function TrainingProviderLoading() {
  return (
    <PublicPageSkeleton label="Loading training provider">
      <Skeleton kind="panel" className="mt-8 h-64 max-w-3xl" />
      <DirectorySkeleton />
    </PublicPageSkeleton>
  );
}
