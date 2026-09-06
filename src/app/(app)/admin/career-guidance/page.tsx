import { CareerGuidanceManager } from "@/components/skillsgap/career-guidance-manager";
import { ManagementNav } from "@/components/skillsgap/management-nav";
import { requirePlatformAdmin } from "@/lib/auth/queries";

export default async function CareerGuidancePage() {
  const { supabase } = await requirePlatformAdmin();
  const [{ data: occupations }, { data: subjects }, { data: actions }, { data: trainingPrograms }] = await Promise.all([
    supabase.from("occupations").select("*").eq("is_active", true).order("role_family").order("title"),
    supabase.from("career_preparation_subjects").select("*").order("subject_name"),
    supabase.from("occupation_pathway_actions").select("*").order("sort_order").order("title"),
    supabase.from("training_programs").select("*").eq("is_active", true).order("name"),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8"><h1 className="text-3xl font-semibold tracking-tight">Career guidance catalogue</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Keep the public “I want to become” routes useful and current. Only active, verified actions appear to visitors.</p><div className="mt-6"><ManagementNav area="admin" /></div><CareerGuidanceManager initialOccupations={occupations ?? []} initialSubjects={subjects ?? []} initialActions={actions ?? []} trainingPrograms={trainingPrograms ?? []} /></div>
  );
}
