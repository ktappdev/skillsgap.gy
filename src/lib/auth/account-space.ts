import type { CompanyStatus } from "@/lib/supabase/database.types";

export type AccountSpace = "admin" | "company" | "company-pending" | "applicant";

export function resolveAccountSpace(isAdmin: boolean, companyStatuses: CompanyStatus[]): AccountSpace {
  if (isAdmin) return "admin";
  if (companyStatuses.includes("approved")) return "company";
  if (companyStatuses.some((status) => status === "pending" || status === "rejected")) return "company-pending";
  return "applicant";
}

export function getAccountHome(space: AccountSpace) {
  if (space === "admin") return "/admin";
  if (space === "company") return "/company";
  if (space === "company-pending") return "/company/request-access";
  return "/dashboard";
}

export function getAccountNavigation(space: AccountSpace) {
  if (space === "admin") return [{ href: "/admin", label: "Admin" }] as const;
  if (space === "company") return [{ href: "/company", label: "Company" }] as const;
  if (space === "company-pending") return [{ href: "/company/request-access", label: "Company access" }] as const;
  return [
    { href: "/dashboard", label: "My pathway" },
    { href: "/interviews", label: "Interviews" },
  ] as const;
}
