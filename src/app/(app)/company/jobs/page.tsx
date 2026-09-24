import { ManagementNav } from "@/components/skillsgap/management-nav";
import { RoleEditor } from "@/components/skillsgap/role-editor";
import { requireApprovedCompanyMember } from "@/lib/auth/queries";
import { fetchAllRows } from "@/lib/supabase/pagination";

export default async function CompanyJobsPage() {
  const { supabase, companyId } = await requireApprovedCompanyMember();
  const [roleRows, qualifications, { data: occupations }, { data: company }] = await Promise.all([
    fetchAllRows((from, to) => supabase.from("job_roles").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).order("id").range(from, to)),
    fetchAllRows((from, to) => supabase.from("qualifications").select("*").eq("is_active", true).order("name").order("id").range(from, to)),
    supabase.from("occupations").select("id,title,role_family").eq("is_active", true).order("title"),
    supabase.from("companies").select("name").eq("id", companyId).maybeSingle(),
  ]);
  const [requirements, qualificationRequests] = await Promise.all([
    roleRows.length > 0
      ? fetchAllRows((from, to) => supabase.from("job_requirements").select("*").in("job_role_id", roleRows.map((role) => role.id)).order("id").range(from, to))
      : Promise.resolve([]),
    fetchAllRows((from, to) => supabase.from("qualification_requests").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).order("id").range(from, to)),
  ]);
  return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><h1 className="text-3xl font-semibold tracking-tight">Roles and requirements</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Draft a role, add weighted canonical requirements, then publish it for matching. Every requirement is connected to the shared taxonomy and can point applicants to verified training.</p><div className="mt-6"><ManagementNav area="company" /></div><RoleEditor companyName={company?.name ?? "your company"} initialRoles={roleRows} initialRequirements={requirements} initialQualificationRequests={qualificationRequests} qualifications={qualifications} occupations={occupations ?? []} /></div>;
}
