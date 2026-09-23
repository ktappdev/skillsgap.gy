import { ManagementNav } from "@/components/skillsgap/management-nav";
import { ProviderQualificationReview } from "@/components/skillsgap/provider-qualification-review";
import { TaxonomyManager } from "@/components/skillsgap/taxonomy-manager";
import { requirePlatformAdmin } from "@/lib/auth/queries";

export default async function QualificationsPage() {
  const { supabase } = await requirePlatformAdmin();
  const [{ data: qualifications }, { data: aliases }] = await Promise.all([
    supabase.from("qualifications").select("*").order("name"),
    supabase.from("qualification_aliases").select("*").order("alias"),
  ]);
  const allQualifications = qualifications ?? [];
  const pendingSuggestions = allQualifications.filter((qualification) => qualification.submission_status === "pending");
  const providerIds = [...new Set(pendingSuggestions.flatMap((qualification) => qualification.submitted_by_provider_id ? [qualification.submitted_by_provider_id] : []))];
  const [{ data: providers }, { data: outcomes }] = providerIds.length > 0
    ? await Promise.all([
      supabase.from("training_providers").select("id,name").in("id", providerIds),
      supabase.from("training_program_outcomes").select("qualification_id,training_program_id").in("qualification_id", pendingSuggestions.map((qualification) => qualification.id)),
    ])
    : [{ data: [] }, { data: [] }];
  const programIds = [...new Set((outcomes ?? []).map((outcome) => outcome.training_program_id))];
  const { data: programs } = programIds.length > 0
    ? await supabase.from("training_programs").select("id,name").in("id", programIds)
    : { data: [] };
  const providersById = new Map((providers ?? []).map((provider) => [provider.id, provider]));
  const programsById = new Map((programs ?? []).map((program) => [program.id, program]));
  const suggestions = pendingSuggestions.map((qualification) => ({
    qualification,
    provider: qualification.submitted_by_provider_id ? providersById.get(qualification.submitted_by_provider_id) ?? null : null,
    programs: (outcomes ?? [])
      .filter((outcome) => outcome.qualification_id === qualification.id)
      .flatMap((outcome) => {
        const program = programsById.get(outcome.training_program_id);
        return program ? [program] : [];
      }),
  }));
  const taxonomyItems = allQualifications.filter((qualification) =>
    qualification.submitted_by_provider_id === null || qualification.submission_status === "approved",
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Qualification taxonomy</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Canonical names and aliases decide how a CV term maps to a requirement. Edit carefully.</p>
      <div className="mt-6"><ManagementNav area="admin" /></div>
      <ProviderQualificationReview suggestions={suggestions} />
      <TaxonomyManager initialItems={taxonomyItems} initialAliases={aliases ?? []} />
    </div>
  );
}
