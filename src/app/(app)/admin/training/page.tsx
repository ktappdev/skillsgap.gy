import { ManagementNav } from "@/components/skillsgap/management-nav";
import { TrainingManager } from "@/components/skillsgap/training-manager";
import { requirePlatformAdmin } from "@/lib/auth/queries";

export default async function TrainingPage() {
  const { supabase } = await requirePlatformAdmin();
  const [{ data: providers }, { data: programs }, { data: outcomes }, { data: qualifications }] = await Promise.all([
    supabase.from("training_providers").select("*").order("name"),
    supabase.from("training_programs").select("*").eq("is_active", true).order("name"),
    supabase.from("training_program_outcomes").select("*"),
    supabase.from("qualifications").select("*").eq("is_active", true).order("name"),
  ]);
  return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><h1 className="text-3xl font-semibold tracking-tight">Local training pathways</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Keep provider details current. Label records as demo data until independently verified.</p><div className="mt-6"><ManagementNav area="admin" /></div><TrainingManager initialProviders={providers ?? []} initialPrograms={programs ?? []} initialOutcomes={outcomes ?? []} qualifications={qualifications ?? []} /></div>;
}
