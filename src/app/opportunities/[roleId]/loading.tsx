import { DetailSkeleton, PublicPageSkeleton } from "@/components/shareable/public-loading";

export default function PositionLoading() {
  return (
    <PublicPageSkeleton label="Loading position details">
      <DetailSkeleton />
    </PublicPageSkeleton>
  );
}
