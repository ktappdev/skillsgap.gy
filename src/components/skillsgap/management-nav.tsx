import Link from "next/link";

const companyLinks = [["/company", "Overview"], ["/company/jobs", "Roles"], ["/company/candidates", "Candidates"], ["/company/job-fairs", "Job fairs"]] as const;
const adminLinks = [["/admin", "Overview"], ["/admin/companies", "Companies"], ["/admin/qualifications", "Qualifications"], ["/admin/training", "Training"]] as const;

export function ManagementNav({ area }: { area: "company" | "admin" }) {
  const links = area === "company" ? companyLinks : adminLinks;
  return <nav className="flex gap-4 overflow-x-auto border-b border-border pb-4 text-sm font-semibold text-muted" aria-label={`${area} navigation`}>{links.map(([href, label]) => <Link key={href} href={href} className="whitespace-nowrap hover:text-accent">{label}</Link>)}</nav>;
}
