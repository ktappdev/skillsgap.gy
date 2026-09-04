import { ManagementNav } from "@/components/skillsgap/management-nav";
import { TaxonomyManager } from "@/components/skillsgap/taxonomy-manager";
import { requirePlatformAdmin } from "@/lib/auth/queries";

export default async function QualificationsPage() {
  const { supabase } = await requirePlatformAdmin();
  const [{ data: qualifications }, { data: aliases }] = await Promise.all([
    supabase.from("qualifications").select("*").order("name"),
    supabase.from("qualification_aliases").select("*").order("alias"),
  ]);
  return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Platform administration</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Qualification taxonomy</h1><p className="mt-3 text-sm leading-6 text-muted">Use canonical names and aliases so a CV term maps to the right requirement.</p><div className="mt-7"><ManagementNav area="admin" /></div><TaxonomyManager initialItems={qualifications ?? []} initialAliases={aliases ?? []} /></div>;
}
