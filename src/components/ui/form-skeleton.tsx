import { LoadingScreen } from "@/components/ui/loading-screen";
import { Skeleton } from "@/components/ui/skeleton";

type FormSkeletonProps = {
  /** Announced to screen readers, e.g. "Loading the sign-in form". */
  label: string;
  /** Field rows to outline. Match the real form so the card height does not jump. */
  fields?: number;
  className?: string;
};

/** The form body only — no card or page chrome — so it drops into an existing shell. */
export function FormSkeleton({ label, fields = 2, className }: FormSkeletonProps) {
  return (
    <LoadingScreen label={label} className={className}>
      <Skeleton kind="line" className="h-8 w-56 max-w-full" />
      <Skeleton kind="line" className="mt-3 h-4 w-full max-w-sm" />
      <Skeleton kind="line" className="mt-2 h-4 w-2/3 max-w-xs" />
      <div className="mt-6 space-y-4">
        {Array.from({ length: fields }, (_, index) => (
          <div key={`field-${index + 1}`}>
            <Skeleton kind="line" className="h-4 w-24" />
            <Skeleton kind="line" className="mt-2 h-11 w-full" />
          </div>
        ))}
      </div>
      <Skeleton kind="line" className="mt-6 h-11 w-full" />
    </LoadingScreen>
  );
}
