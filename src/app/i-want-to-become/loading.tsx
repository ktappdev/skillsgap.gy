import { PublicPageSkeleton } from "@/components/shareable/public-loading";
import { Skeleton } from "@/components/ui/skeleton";

export default function CareerExplorerLoading() {
  return (
    <PublicPageSkeleton label="Loading the career route builder">
      <section className="mt-8 border-b border-border py-10 sm:py-12">
        <Skeleton kind="line" className="h-3 w-28" />
        <Skeleton kind="line" className="mt-3 h-10 w-full max-w-xl sm:h-12" />
        <Skeleton kind="line" className="mt-2 h-10 w-2/3 max-w-lg" />
        <Skeleton kind="line" className="mt-6 h-5 w-full max-w-2xl" />
        <Skeleton kind="line" className="mt-2 h-5 w-3/4 max-w-xl" />
        <Skeleton kind="line" className="mt-6 h-11 w-40" />
      </section>
      <Skeleton kind="panel" className="mt-10 h-20" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Skeleton kind="panel" className="h-80" />
        <Skeleton kind="panel" className="h-72" />
      </div>
    </PublicPageSkeleton>
  );
}
