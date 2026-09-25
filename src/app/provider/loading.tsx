import { FormSkeleton } from "@/components/ui/form-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

// Covers /provider/setup: logo, then the organisation details card.
export default function ProviderSetupLoading() {
  return (
    <main id="main-content" className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-xl">
        <Skeleton kind="line" className="h-7 w-32 sm:h-8" />
        <section className="mt-6 rounded-lg border border-border bg-surface p-6 sm:p-8">
          <FormSkeleton label="Loading provider setup" fields={8} />
        </section>
      </div>
    </main>
  );
}
