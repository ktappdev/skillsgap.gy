import { FormSkeleton } from "@/components/ui/form-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

// Covers the company request form and the recruiter invitation page: both are a
// narrow column with one card.
export default function CompanyLoading() {
  return (
    <main id="main-content" className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-xl">
        <Skeleton kind="line" className="h-5 w-32" />
        <section className="mt-6 rounded-lg border border-border bg-surface p-6">
          <FormSkeleton label="Loading company access" fields={6} />
        </section>
      </div>
    </main>
  );
}
