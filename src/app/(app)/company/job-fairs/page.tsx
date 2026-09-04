import { ManagementNav } from "@/components/skillsgap/management-nav";
import { SlotManager } from "@/components/skillsgap/slot-manager";
import { requireApprovedCompanyMember } from "@/lib/auth/queries";

export default async function JobFairsPage() {
  const { supabase, companyId } = await requireApprovedCompanyMember();
  const { data: fairs } = await supabase.from("job_fairs").select("*").eq("company_id", companyId).order("starts_at", { ascending: true });
  const fairRows = fairs ?? [];
  const { data: slots } = fairRows.length > 0 ? await supabase.from("interview_slots").select("*").in("job_fair_id", fairRows.map((fair) => fair.id)).order("starts_at") : { data: [] };
  return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Company workspace</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Job fairs and interview slots</h1><div className="mt-7"><ManagementNav area="company" /></div><SlotManager initialFairs={fairRows} initialSlots={slots ?? []} /></div>;
}
