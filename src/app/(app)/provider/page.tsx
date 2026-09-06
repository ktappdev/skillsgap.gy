import { ManagementNav } from "@/components/skillsgap/management-nav";
import { ProviderDashboard } from "@/components/skillsgap/provider-dashboard";
import { requireTrainingProvider } from "@/lib/auth/queries";

export default async function ProviderPage() {
  const { supabase, provider } = await requireTrainingProvider();
  const { count: programCount } = await supabase
    .from("training_programs")
    .select("id", { count: "exact", head: true })
    .eq("provider_id", provider.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Training provider workspace</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-[-0.04em]">{provider.name}</h1>
        <span
          className={
            provider.is_verified
              ? "inline-flex items-center bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white"
              : "inline-flex items-center border border-border px-2.5 py-1 text-xs font-semibold text-muted"
          }
        >
          {provider.is_verified ? "Verified" : "Pending verification"}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">
        Keep your provider profile current so applicants can find and trust your training programs.
      </p>
      <div className="mt-7">
        <ManagementNav area="provider" />
      </div>
      <ProviderDashboard initialProvider={provider} programCount={programCount ?? 0} />
    </div>
  );
}
