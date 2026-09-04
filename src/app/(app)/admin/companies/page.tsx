import { ManagementNav } from "@/components/skillsgap/management-nav";
import { CompanyApprovals } from "@/components/skillsgap/company-approvals";
import { requirePlatformAdmin } from "@/lib/auth/queries";

export default async function AdminCompaniesPage() {
  const { supabase } = await requirePlatformAdmin();
  const { data: requests } = await supabase.from("companies").select("*").eq("status", "pending").order("created_at", { ascending: false });
  return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Platform administration</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Company verification</h1><div className="mt-7"><ManagementNav area="admin" /></div><CompanyApprovals requests={requests ?? []} /></div>;
}
