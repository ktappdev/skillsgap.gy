import { DirectorySkeleton, PublicHeroSkeleton, PublicPageSkeleton } from "@/components/shareable/public-loading";

export default function OpportunitiesLoading() {
  return (
    <PublicPageSkeleton label="Loading open positions">
      <PublicHeroSkeleton />
      <DirectorySkeleton />
    </PublicPageSkeleton>
  );
}
