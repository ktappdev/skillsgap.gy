import { DirectorySkeleton, PublicHeroSkeleton, PublicPageSkeleton } from "@/components/shareable/public-loading";

export default function TrainingLoading() {
  return (
    <PublicPageSkeleton label="Loading training courses">
      <PublicHeroSkeleton />
      <DirectorySkeleton />
    </PublicPageSkeleton>
  );
}
