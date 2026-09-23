import { ManagementNav } from "@/components/skillsgap/management-nav";
import { ProviderProgramManager } from "@/components/skillsgap/provider-program-manager";
import { requireTrainingProvider } from "@/lib/auth/queries";
import type { Tables } from "@/lib/supabase/database.types";

export default async function ProviderProgramsPage() {
  const { supabase, provider } = await requireTrainingProvider("/provider/programs");

  const { data: programs } = await supabase
    .from("training_programs")
    .select("*")
    .eq("provider_id", provider.id)
    .order("name");

  const programIds = (programs ?? []).map((program) => program.id);

  const [outcomesResult, { data: activeQualifications }, { data: providerSuggestions }, { data: aliases }] = await Promise.all([
    programIds.length > 0
      ? supabase
          .from("training_program_outcomes")
          .select("*")
          .in("training_program_id", programIds)
      : Promise.resolve({ data: [] as Tables<"training_program_outcomes">[] | null }),
    supabase.from("qualifications").select("*").eq("is_active", true).order("name"),
    supabase.from("qualifications").select("*").eq("submitted_by_provider_id", provider.id).order("name"),
    supabase.from("qualification_aliases").select("*"),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">{provider.name} programs</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        Map each program to the qualifications it delivers so applicants find the right pathway.
      </p>
      <div className="mt-6">
        <ManagementNav area="provider" />
      </div>
      <ProviderProgramManager
        providerName={provider.name}
        providerVerified={provider.is_verified}
        programs={programs ?? []}
        outcomes={outcomesResult.data ?? []}
        qualifications={[
          ...(activeQualifications ?? []),
          ...(providerSuggestions ?? []).filter((suggestion) => suggestion.submission_status !== "approved"),
        ].filter((qualification, index, all) => all.findIndex((item) => item.id === qualification.id) === index)}
        aliases={aliases ?? []}
      />
    </div>
  );
}
