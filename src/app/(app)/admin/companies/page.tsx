import { ManagementNav } from "@/components/skillsgap/management-nav";
import { CompanyApprovals } from "@/components/skillsgap/company-approvals";
import { requirePlatformAdmin } from "@/lib/auth/queries";

export default async function AdminCompaniesPage() {
  const { supabase } = await requirePlatformAdmin();
  const { data: requests } = await supabase.from("companies").select("*").eq("status", "pending").order("created_at", { ascending: false });
  return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><h1 className="text-3xl font-semibold tracking-tight">Company verification</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Approve companies you trust to post roles and invite matched applicants.</p><div className="mt-6"><ManagementNav area="admin" /></div><CompanyApprovals requests={requests ?? []} /></div>;
}
