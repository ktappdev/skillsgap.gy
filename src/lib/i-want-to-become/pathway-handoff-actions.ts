"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";

import { resolveUserHome } from "@/lib/auth/queries";
import { saveApplicantPathwayPlan } from "@/lib/i-want-to-become/pathway-actions";
import {
  getPathwayHandoffTokenFromReturnPath,
  isPathwayHandoffToken,
  pathwaySaveOAuthCallbackPath,
} from "@/lib/i-want-to-become/pathway-handoff";
import {
  bindPathwayHandoffToEmail,
  hashPathwayHandoffToken,
  pathwayHandoffOAuthCookieName,
  pathwayHandoffOAuthCookiePath,
} from "@/lib/i-want-to-become/pathway-handoff-server";
import { parsePathwayPlanDraft, pathwayPlanLifetimeMs, type PathwayPlanDraft } from "@/lib/i-want-to-become/pathway-plan";
import { createClient } from "@/lib/supabase/server";
import { getSafeRedirectPath } from "@/lib/validation";

const maxHandoffPayloadBytes = 16 * 1024;
const invalidHandoffMessage = "This save link is invalid, expired, or already used. Build the route again to save it.";

export type CreatePathwayPlanHandoffResult = {
  token?: string;
  error?: string;
};

export async function createPathwayPlanHandoff(input: PathwayPlanDraft): Promise<CreatePathwayPlanHandoffResult> {
  const draft = parsePathwayPlanDraft(input, { enforceFreshness: true });
  if (!draft || Date.parse(draft.createdAt) + pathwayPlanLifetimeMs <= Date.now()
    || new TextEncoder().encode(JSON.stringify(draft)).length > maxHandoffPayloadBytes) {
    return { error: "This route is too large or incomplete to save. Review it and try again." };
  }

  const token = randomBytes(32).toString("base64url");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_pathway_plan_handoff", {
    target_token_hash: hashPathwayHandoffToken(token),
    target_payload: draft,
  });
  if (error || data !== true) {
    return { error: "We could not prepare your secure save link. Please try again." };
  }

  return { token };
}

export async function bindPathwayPlanHandoffToEmail(token: string, email: string): Promise<boolean> {
  if (!isPathwayHandoffToken(token)) return false;
  const supabase = await createClient();
  const result = await bindPathwayHandoffToEmail(supabase, token, email);
  return result.bound;
}

export type PreparePathwayOAuthResult = { next?: string; error?: string };

export async function preparePathwayOAuth(next: string): Promise<PreparePathwayOAuthResult> {
  const cookieStore = await cookies();
  cookieStore.set(pathwayHandoffOAuthCookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: pathwayHandoffOAuthCookiePath,
    maxAge: 0,
  });

  const safeNext = next ? getSafeRedirectPath(next, "") : "";
  if (next && !safeNext) return { error: "We could not prepare a safe sign-in redirect. Reload and try again." };

  const token = getPathwayHandoffTokenFromReturnPath(safeNext);
  if (!token) return { next: safeNext };

  cookieStore.set(pathwayHandoffOAuthCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: pathwayHandoffOAuthCookiePath,
    maxAge: 24 * 60 * 60,
  });
  return { next: pathwaySaveOAuthCallbackPath };
}

export async function clearPathwayOAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(pathwayHandoffOAuthCookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: pathwayHandoffOAuthCookiePath,
    maxAge: 0,
  });
}

export type SavePathwayPlanHandoffResult = {
  completed?: boolean;
  draft?: PathwayPlanDraft;
  error?: string;
  retryable?: boolean;
};

export async function savePathwayPlanFromHandoff(token: string): Promise<SavePathwayPlanHandoffResult> {
  if (!isPathwayHandoffToken(token)) return { error: invalidHandoffMessage };

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return { error: "Sign in to finish saving this route.", retryable: false };

  let accountHome: string;
  try {
    accountHome = await resolveUserHome(supabase, authData.user.id);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[pdbg] pathway-handoff-actions.ts applicant account lookup failed", error);
    }
    return { error: "We could not verify your account type yet. Try saving this route again in a moment.", retryable: true };
  }
  if (accountHome === "/auth/error?reason=workspace") {
    return { error: "We could not verify your account type yet. Try saving this route again in a moment.", retryable: true };
  }
  if (accountHome !== "/dashboard") {
    return { error: "Career routes can only be saved to an applicant account.", retryable: false };
  }

  const binding = await bindPathwayHandoffToEmail(supabase, token, authData.user.email);
  if (!binding.bound) {
    return {
      error: binding.retryable ? "We could not verify this save link yet. Try again in a moment." : invalidHandoffMessage,
      retryable: binding.retryable,
    };
  }

  const tokenHash = hashPathwayHandoffToken(token);
  const { data: payload, error: claimError } = await supabase.rpc("claim_pathway_plan_handoff", {
    target_token_hash: tokenHash,
  });
  if (claimError) return { error: "We could not retrieve your saved route. Try again in a moment.", retryable: true };

  const claim = typeof payload === "object" && payload !== null && !Array.isArray(payload)
    ? payload as { status?: unknown; payload?: unknown }
    : null;
  if (claim?.status === "completed") return { completed: true };
  if (claim?.status !== "claimed") return { error: invalidHandoffMessage };

  const draft = parsePathwayPlanDraft(claim.payload, { enforceFreshness: true });
  if (!draft) return { error: invalidHandoffMessage };

  const saveResult = await saveApplicantPathwayPlan(draft);
  if (saveResult.error) return { error: saveResult.error, retryable: true };

  try {
    const { data: completed, error: completionError } = await supabase.rpc("complete_pathway_plan_handoff", { target_token_hash: tokenHash });
    if (completionError || completed !== true) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[pdbg] pathway-handoff-actions.ts completion cleanup failed", completionError);
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[pdbg] pathway-handoff-actions.ts completion cleanup threw", error);
    }
  }
  return { completed: true, draft };
}
