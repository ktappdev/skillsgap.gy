import { ManagementNav } from "@/components/skillsgap/management-nav";
import { ProviderDashboard } from "@/components/skillsgap/provider-dashboard";
import { requireTrainingProvider } from "@/lib/auth/queries";

export default async function ProviderPage() {
  const { supabase, provider } = await requireTrainingProvider("/provider");
  const [{ data: programs }, { data: verificationDetails }] = await Promise.all([
    supabase.from("training_programs").select("id,is_active").eq("provider_id", provider.id),
    supabase.from("training_provider_verification_details").select("*").eq("provider_id", provider.id).maybeSingle(),
  ]);
  const programIds = (programs ?? []).map((program) => program.id);
  const { data: outcomes } = programIds.length > 0
    ? await supabase.from("training_program_outcomes").select("training_program_id,qualification_id").in("training_program_id", programIds)
    : { data: [] };
  const qualificationIds = [...new Set((outcomes ?? []).map((outcome) => outcome.qualification_id))];
  const { data: activeQualifications } = qualificationIds.length > 0
    ? await supabase.from("qualifications").select("id").in("id", qualificationIds).eq("is_active", true)
    : { data: [] };
  const activeQualificationIds = new Set((activeQualifications ?? []).map((qualification) => qualification.id));
  const recommendedProgramIds = new Set((outcomes ?? []).filter((outcome) => activeQualificationIds.has(outcome.qualification_id)).map((outcome) => outcome.training_program_id));
  const programStats = {
    total: programs?.length ?? 0,
    ready: (programs ?? []).filter((program) => recommendedProgramIds.has(program.id)).length,
    live: (programs ?? []).filter((program) => program.is_active && recommendedProgramIds.has(program.id)).length,
  };

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
      <ProviderDashboard initialProvider={provider} verificationDetails={verificationDetails} programStats={programStats} />
    </div>
  );
}
