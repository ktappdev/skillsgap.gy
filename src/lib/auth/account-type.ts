import type { AccountType } from "@/lib/supabase/database.types";

export function parseAccountType(value: string | null | undefined): AccountType {
  if (value === "company" || value === "provider") return value;
  return "applicant";
}
