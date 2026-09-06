import { ManagementNav } from "@/components/skillsgap/management-nav";
import { TaxonomyManager } from "@/components/skillsgap/taxonomy-manager";
import { requirePlatformAdmin } from "@/lib/auth/queries";

export default async function QualificationsPage() {
  const { supabase } = await requirePlatformAdmin();
  const [{ data: qualifications }, { data: aliases }] = await Promise.all([
    supabase.from("qualifications").select("*").order("name"),
    supabase.from("qualification_aliases").select("*").order("alias"),
  ]);
  return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><h1 className="text-3xl font-semibold tracking-tight">Qualification taxonomy</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Canonical names and aliases decide how a CV term maps to a requirement. Edit carefully.</p><div className="mt-6"><ManagementNav area="admin" /></div><TaxonomyManager initialItems={qualifications ?? []} initialAliases={aliases ?? []} /></div>;
}
