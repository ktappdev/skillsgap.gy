import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import { isPathwayHandoffToken } from "@/lib/i-want-to-become/pathway-handoff";
import type { Database } from "@/lib/supabase/database.types";

export const pathwayHandoffOAuthCookieName = "skillsgap-pathway-oauth-handoff";
export const pathwayHandoffOAuthCookiePath = "/auth/callback";

export function hashPathwayHandoffToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

type BindPathwayHandoffResult = {
  bound: boolean;
  retryable: boolean;
};

export async function bindPathwayHandoffToEmail(
  supabase: SupabaseClient<Database>,
  token: string,
  email: string | null | undefined,
): Promise<BindPathwayHandoffResult> {
  if (!isPathwayHandoffToken(token) || !email) return { bound: false, retryable: false };
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || normalizedEmail.length > 320 || normalizedEmail.indexOf("@") < 1) {
    return { bound: false, retryable: false };
  }

  try {
    const { data, error } = await supabase.rpc("bind_pathway_plan_handoff", {
      target_token_hash: hashPathwayHandoffToken(token),
      target_email: normalizedEmail,
    });
    if (error) return { bound: false, retryable: true };
    return { bound: data === true, retryable: false };
  } catch {
    return { bound: false, retryable: true };
  }
}
