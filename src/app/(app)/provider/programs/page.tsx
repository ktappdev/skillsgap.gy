import { ManagementNav } from "@/components/skillsgap/management-nav";
import { ProviderProgramManager } from "@/components/skillsgap/provider-program-manager";
import { requireTrainingProvider } from "@/lib/auth/queries";
import type { Tables } from "@/lib/supabase/database.types";

export default async function ProviderProgramsPage() {
  const { supabase, provider } = await requireTrainingProvider();

  const { data: programs } = await supabase
    .from("training_programs")
    .select("*")
    .eq("provider_id", provider.id)
    .order("name");

  const programIds = (programs ?? []).map((program) => program.id);

  const [outcomesResult, { data: qualifications }] = await Promise.all([
    programIds.length > 0
      ? supabase
          .from("training_program_outcomes")
          .select("*")
          .in("training_program_id", programIds)
      : Promise.resolve({ data: [] as Tables<"training_program_outcomes">[] | null }),
    supabase.from("qualifications").select("*").eq("is_active", true).order("name"),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Training programs</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{provider.name} programs</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Add and manage the training programs you offer. Map each program to the qualifications it
        delivers so applicants can find the right pathway.
      </p>
      <div className="mt-7">
        <ManagementNav area="provider" />
      </div>
      <ProviderProgramManager
        programs={programs ?? []}
        outcomes={outcomesResult.data ?? []}
        qualifications={qualifications ?? []}
      />
    </div>
  );
}
