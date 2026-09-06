"use server";

import { revalidatePath } from "next/cache";

import { resolveUserHome } from "@/lib/auth/queries";
import { getDatabaseErrorMessage } from "@/lib/errors";
import {
  getStaticOccupationPathway,
  isPublicOccupationPathwayRpcRow,
  normalizePublicOccupationPathway,
} from "@/lib/i-want-to-become/occupations";
import { parsePathwayPlanDraft, type PathwayPlanDraft } from "@/lib/i-want-to-become/pathway-plan";
import { validateGuidedPathwayPlan, validateOccupationPathwayPlan } from "@/lib/i-want-to-become/pathway-validation";
import { createClient } from "@/lib/supabase/server";

export type SaveApplicantPathwayPlanResult = {
  error?: string;
  message?: string;
};

export async function saveApplicantPathwayPlan(input: PathwayPlanDraft): Promise<SaveApplicantPathwayPlanResult> {
  const draft = parsePathwayPlanDraft(input, { enforceFreshness: true });
  if (!draft) return { error: "That saved route is incomplete or has expired. Build the route again to continue." };

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return { error: "Sign in to save this route to your dashboard." };

  const accountHome = await resolveUserHome(supabase, authData.user.id);
  if (accountHome !== "/dashboard") return { error: "Career routes can only be saved to an applicant account." };

  let canonicalPlan;

  if (draft.pathwayKind === "guided") {
    canonicalPlan = validateGuidedPathwayPlan(draft);
    if (!canonicalPlan) return { error: "That career route or one of its selected requirements is no longer available. Review the route and try again." };
  } else {
    const { data, error } = await supabase.rpc("get_public_occupation_pathway", {
      occupation_slug: draft.pathwayKey,
    });
    const row = !error && Array.isArray(data) && data.length === 1 && isPublicOccupationPathwayRpcRow(data[0])
      ? data[0]
      : null;
    const pathway = row ? normalizePublicOccupationPathway(row) : getStaticOccupationPathway(draft.pathwayKey);
    if (!pathway) return { error: "That occupation route is no longer available." };
    canonicalPlan = validateOccupationPathwayPlan(draft, pathway);
    if (!canonicalPlan) return { error: "One of the completed actions is no longer available. Review the route and try again." };
  }

  const { error } = await supabase.from("applicant_pathway_plans").upsert({
    applicant_id: authData.user.id,
    pathway_kind: draft.pathwayKind,
    pathway_key: draft.pathwayKey,
    pathway_title: canonicalPlan.pathwayTitle,
    interests_note: draft.interests,
    selected_interests: draft.selectedInterests,
    csec_results: draft.results.map(({ subject, grade }) => ({ subject, grade })),
    planned_requirement_names: canonicalPlan.plannedRequirementNames,
    completed_action_ids: canonicalPlan.completedActionIds,
  }, { onConflict: "applicant_id" });

  if (error) return { error: getDatabaseErrorMessage(error, "We could not save your career route. Your browser copy is still available, so you can try again.") };

  revalidatePath("/dashboard");
  return { message: "Your career route is saved to your dashboard." };
}
