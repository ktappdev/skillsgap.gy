import type { CompanyStatus } from "@/lib/supabase/database.types";

export type AccountSpace = "admin" | "company" | "provider" | "provider-pending" | "company-pending" | "applicant";

export function resolveAccountSpace(
  isAdmin: boolean,
  companyStatuses: CompanyStatus[],
  isProvider: boolean,
  isProviderPending = false,
  isCompanyPending = false,
): AccountSpace {
  if (isAdmin) return "admin";
  if (companyStatuses.includes("approved")) return "company";
  if (isProvider) return "provider";
  if (isProviderPending) return "provider-pending";
  if (isCompanyPending || companyStatuses.some((status) => status === "pending" || status === "rejected")) return "company-pending";
  return "applicant";
}

export function getAccountHome(space: AccountSpace) {
  if (space === "admin") return "/admin";
  if (space === "company") return "/company";
  if (space === "provider") return "/provider";
  if (space === "provider-pending") return "/provider/setup";
  if (space === "company-pending") return "/company/request-access";
  return "/dashboard";
}

export function getAccountNavigation(space: AccountSpace) {
  if (space === "admin") return [{ href: "/admin", label: "Admin" }] as const;
  if (space === "company") return [{ href: "/company", label: "Company" }] as const;
  if (space === "provider") return [{ href: "/provider", label: "Provider" }] as const;
  if (space === "provider-pending") return [] as const;
  if (space === "company-pending") return [{ href: "/company/request-access", label: "Company access" }] as const;
  return [
    { href: "/dashboard/overview", label: "Dashboard" },
    { href: "/dashboard", label: "My pathway" },
    { href: "/opportunities", label: "Positions" },
    { href: "/training", label: "Training" },
    { href: "/i-want-to-become", label: "Build a route" },
    { href: "/interviews", label: "Interviews" },
  ] as const;
}
