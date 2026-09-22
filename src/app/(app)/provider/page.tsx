import { ManagementNav } from "@/components/skillsgap/management-nav";
import { ProviderDashboard } from "@/components/skillsgap/provider-dashboard";
import { requireTrainingProvider } from "@/lib/auth/queries";

export default async function ProviderPage() {
  const { supabase, provider } = await requireTrainingProvider("/provider");
  const { count: programCount } = await supabase
    .from("training_programs")
    .select("id", { count: "exact", head: true })
    .eq("provider_id", provider.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{provider.name}</h1>
        <span
          className={
            provider.is_verified
              ? "inline-flex min-h-11 items-center rounded-md bg-accent px-2.5 text-xs font-semibold text-white"
              : "inline-flex min-h-11 items-center rounded-md border border-border px-2.5 text-xs font-semibold text-muted"
          }
        >
          {provider.is_verified ? "Verified" : "Pending verification"}
        </span>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        Keep your profile current so applicants can find and trust your training programs.
      </p>
      <div className="mt-6">
        <ManagementNav area="provider" />
      </div>
      <ProviderDashboard initialProvider={provider} programCount={programCount ?? 0} />
    </div>
  );
}
