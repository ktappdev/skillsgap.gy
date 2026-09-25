import { DetailSkeleton, PublicPageSkeleton } from "@/components/shareable/public-loading";

export default function CourseLoading() {
  return (
    <PublicPageSkeleton label="Loading course details">
      <DetailSkeleton />
    </PublicPageSkeleton>
  );
}
