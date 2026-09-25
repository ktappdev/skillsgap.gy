import { ManagementNav } from "@/components/skillsgap/management-nav";
import { SlotManager } from "@/components/skillsgap/slot-manager";
import { requireApprovedCompanyMember } from "@/lib/auth/queries";

export default async function JobFairsPage() {
  const { supabase, companyId } = await requireApprovedCompanyMember("/company/job-fairs");
  const { data: fairs } = await supabase.from("job_fairs").select("*").eq("company_id", companyId).order("starts_at", { ascending: true });
  const fairRows = fairs ?? [];
  const { data: slots } = fairRows.length > 0 ? await supabase.from("interview_slots").select("*").in("job_fair_id", fairRows.map((fair) => fair.id)).order("starts_at") : { data: [] };
  return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><h1 className="text-3xl font-semibold tracking-tight">Job fairs and interview slots</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Open a fair, add 15-minute slots in Guyana time, and let matched applicants book.</p><div className="mt-6"><ManagementNav area="company" /></div><SlotManager initialFairs={fairRows} initialSlots={slots ?? []} /></div>;
}
