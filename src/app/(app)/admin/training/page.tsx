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
  return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Platform administration</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Local training pathways</h1><p className="mt-3 text-sm leading-6 text-muted">Keep provider details current. Label records as demo data until independently verified.</p><div className="mt-7"><ManagementNav area="admin" /></div><TrainingManager initialProviders={providers ?? []} initialPrograms={programs ?? []} initialOutcomes={outcomes ?? []} qualifications={qualifications ?? []} /></div>;
}
