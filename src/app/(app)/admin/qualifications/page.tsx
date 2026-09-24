import { ManagementNav } from "@/components/skillsgap/management-nav";
import { QualificationSubmissionReview } from "@/components/skillsgap/qualification-submission-review";
import { TaxonomyManager } from "@/components/skillsgap/taxonomy-manager";
import { requirePlatformAdmin } from "@/lib/auth/queries";
import { fetchAllRows } from "@/lib/supabase/pagination";

export default async function QualificationsPage() {
  const { supabase } = await requirePlatformAdmin();
  const [allQualifications, allAliases, pendingRequests, { data: qualificationsWithoutTraining }] = await Promise.all([
    fetchAllRows((from, to) => supabase.from("qualifications").select("*").order("name").order("id").range(from, to)),
    fetchAllRows((from, to) => supabase.from("qualification_aliases").select("*").order("alias").order("id").range(from, to)),
    fetchAllRows((from, to) => supabase.from("qualification_requests").select("*").eq("status", "pending").order("created_at", { ascending: true }).order("id").range(from, to)),
    supabase.rpc("get_qualifications_without_verified_training"),
  ]);
  const pendingSuggestions = allQualifications.filter((qualification) => qualification.submission_status === "pending");
  const providerIds = [...new Set(pendingSuggestions.flatMap((qualification) => qualification.submitted_by_provider_id ? [qualification.submitted_by_provider_id] : []))];
  const requestCompanyIds = [...new Set(pendingRequests.map((request) => request.company_id))];
  const requestRoleIds = [...new Set(pendingRequests.map((request) => request.job_role_id))];
  const [{ data: providers }, { data: outcomes }, { data: companies }, { data: roles }] = await Promise.all([
    providerIds.length > 0
      ? supabase.from("training_providers").select("id,name").in("id", providerIds)
      : Promise.resolve({ data: [] }),
    pendingSuggestions.length > 0
      ? supabase.from("training_program_outcomes").select("qualification_id,training_program_id").in("qualification_id", pendingSuggestions.map((qualification) => qualification.id))
      : Promise.resolve({ data: [] }),
    requestCompanyIds.length > 0
      ? supabase.from("companies").select("id,name").in("id", requestCompanyIds)
      : Promise.resolve({ data: [] }),
    requestRoleIds.length > 0
      ? supabase.from("job_roles").select("id,title").in("id", requestRoleIds)
      : Promise.resolve({ data: [] }),
  ]);
  const programIds = [...new Set((outcomes ?? []).map((outcome) => outcome.training_program_id))];
  const { data: programs } = programIds.length > 0
    ? await supabase.from("training_programs").select("id,name").in("id", programIds)
    : { data: [] };
  const providersById = new Map((providers ?? []).map((provider) => [provider.id, provider]));
  const programsById = new Map((programs ?? []).map((program) => [program.id, program]));
  const companiesById = new Map((companies ?? []).map((company) => [company.id, company]));
  const rolesById = new Map((roles ?? []).map((role) => [role.id, role]));
  const submissions = [
    ...pendingRequests.map((request) => ({
      source: "employer" as const,
      request,
      companyName: companiesById.get(request.company_id)?.name ?? "Company account unavailable",
      roleTitle: rolesById.get(request.job_role_id)?.title ?? "Job role unavailable",
    })),
    ...pendingSuggestions.map((qualification) => ({
      source: "provider" as const,
      qualification,
      providerName: qualification.submitted_by_provider_id ? providersById.get(qualification.submitted_by_provider_id)?.name ?? "Provider account unavailable" : "Provider account unavailable",
      programNames: (outcomes ?? [])
        .filter((outcome) => outcome.qualification_id === qualification.id)
        .flatMap((outcome) => {
          const program = programsById.get(outcome.training_program_id);
          return program ? [program.name] : [];
        }),
    })),
  ];
  const taxonomyItems = allQualifications.filter((qualification) =>
    qualification.submitted_by_provider_id === null || qualification.submission_status === "approved",
  );
  const taxonomyRevision = createTaxonomyRevision(taxonomyItems, allAliases);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Qualification taxonomy</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Canonical names and aliases decide how a CV term maps to a requirement. Edit carefully.</p>
      <div className="mt-6"><ManagementNav area="admin" /></div>
      <QualificationSubmissionReview initialSubmissions={submissions} qualifications={allQualifications} aliases={allAliases} />
      <TaxonomyManager key={taxonomyRevision} initialItems={taxonomyItems} initialAliases={allAliases} qualificationsWithoutTraining={qualificationsWithoutTraining ?? []} />
    </div>
  );
}

function createTaxonomyRevision(
  qualifications: Array<{ id: string; updated_at: string }>,
  aliases: Array<{ id: string; created_at: string }>,
) {
  let hash = 2166136261;
  for (const value of [
    ...qualifications.map((qualification) => `${qualification.id}:${qualification.updated_at}`),
    ...aliases.map((alias) => `${alias.id}:${alias.created_at}`),
  ]) {
    for (let index = 0; index < value.length; index += 1) {
      hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
    }
  }
  return `${qualifications.length}-${aliases.length}-${hash >>> 0}`;
}
