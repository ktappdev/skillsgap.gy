import { ManagementNav } from "@/components/skillsgap/management-nav";
import { RoleEditor } from "@/components/skillsgap/role-editor";
import { requireApprovedCompanyMember } from "@/lib/auth/queries";

export default async function CompanyJobsPage() {
  const { supabase, companyId } = await requireApprovedCompanyMember();
  const [{ data: roles }, { data: qualifications }, { data: company }] = await Promise.all([
    supabase.from("job_roles").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
    supabase.from("qualifications").select("*").eq("is_active", true).order("name"),
    supabase.from("companies").select("name").eq("id", companyId).maybeSingle(),
  ]);
  const roleRows = roles ?? [];
  const { data: requirements } = roleRows.length > 0 ? await supabase.from("job_requirements").select("*").in("job_role_id", roleRows.map((role) => role.id)) : { data: [] };
  return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Company workspace</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Roles and requirements</h1><div className="mt-7"><ManagementNav area="company" /></div><RoleEditor companyName={company?.name ?? "your company"} initialRoles={roleRows} initialRequirements={requirements ?? []} qualifications={qualifications ?? []} /></div>;
}
