import Link from "next/link";

const companyLinks = [["/company", "Overview"], ["/company/jobs", "Roles"], ["/company/candidates", "Candidates"], ["/company/job-fairs", "Job fairs"], ["/company/team", "Team"]] as const;
const adminLinks = [["/admin", "Overview"], ["/admin/companies", "Companies"], ["/admin/qualifications", "Qualifications"], ["/admin/training", "Training"], ["/admin/career-guidance", "Career guidance"]] as const;
const providerLinks = [["/provider", "Overview"], ["/provider/programs", "Programs"]] as const;

export function ManagementNav({ area }: { area: "company" | "admin" | "provider" }) {
  const links = area === "company" ? companyLinks : area === "admin" ? adminLinks : providerLinks;
  return <nav className="flex gap-2 overflow-x-auto border-b border-border text-sm font-semibold text-muted" aria-label={`${area} navigation`}>{links.map(([href, label]) => <Link key={href} href={href} className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-md px-3 hover:bg-surface-muted hover:text-accent">{label}</Link>)}</nav>;
}
