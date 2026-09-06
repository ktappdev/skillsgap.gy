import { findCareerPathway } from "@/lib/i-want-to-become/catalog";
import type { PublicOccupationPathway } from "@/lib/i-want-to-become/occupations";
import type { PathwayPlanDraft } from "@/lib/i-want-to-become/pathway-plan";

export type CanonicalPathwayPlan = {
  pathwayTitle: string;
  plannedRequirementNames: string[];
  completedActionIds: string[];
};

export function validateGuidedPathwayPlan(draft: PathwayPlanDraft): CanonicalPathwayPlan | null {
  if (draft.pathwayKind !== "guided") return null;
  const pathway = findCareerPathway(draft.pathwayKey);
  if (!pathway) return null;
  const allowedRequirements = new Set(pathway.requirements.map((requirement) => requirement.name));
  if (draft.plannedRequirementNames.some((name) => !allowedRequirements.has(name))) return null;
  return {
    pathwayTitle: pathway.title,
    plannedRequirementNames: draft.plannedRequirementNames,
    completedActionIds: [],
  };
}

export function validateOccupationPathwayPlan(draft: PathwayPlanDraft, pathway: PublicOccupationPathway): CanonicalPathwayPlan | null {
  if (draft.pathwayKind !== "occupation" || draft.pathwayKey !== pathway.slug) return null;
  const allowedActions = new Set(pathway.actions.map((action) => action.id));
  if (draft.completedActionIds.some((id) => !allowedActions.has(id))) return null;
  return {
    pathwayTitle: pathway.title,
    plannedRequirementNames: [],
    completedActionIds: draft.completedActionIds,
  };
}
