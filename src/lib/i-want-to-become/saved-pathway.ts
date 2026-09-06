import "server-only";

import { findCareerPathway, type CareerRequirement } from "@/lib/i-want-to-become/catalog";
import { getStaticOccupationPathway } from "@/lib/i-want-to-become/occupations";
import type { Tables } from "@/lib/supabase/database.types";
import { getPublicPositions } from "@/lib/share/public-content";

export type SavedPathwayItem = {
  id: string;
  kind: "requirement" | "action";
  name: string;
  detail: string | null;
  mandatory: boolean;
  minimumYears: number | null;
  supportingText: string | null;
  status: "saved" | "complete" | "available";
};

export type SavedPathwayView = {
  href: string;
  linkLabel: string;
  itemLabel: string;
  items: SavedPathwayItem[];
};

function pathwayHref(pathwayKey: string) {
  return `/i-want-to-become?pathway=${encodeURIComponent(pathwayKey)}`;
}

function toGuidedItem(requirement: CareerRequirement, plannedNames: Set<string>): SavedPathwayItem {
  return {
    id: requirement.name,
    kind: "requirement",
    name: requirement.name,
    detail: requirement.detail,
    mandatory: requirement.mandatory,
    minimumYears: requirement.minimumYears,
    supportingText: requirement.training ? `Training to explore: ${requirement.training}` : null,
    status: plannedNames.has(requirement.name) ? "saved" : "available",
  };
}

export async function getSavedPathwayView(plan: Tables<"applicant_pathway_plans">): Promise<SavedPathwayView> {
  if (plan.pathway_kind === "guided") {
    const pathway = findCareerPathway(plan.pathway_key);
    const plannedNames = new Set(plan.planned_requirement_names);
    const items = pathway?.requirements.map((requirement) => toGuidedItem(requirement, plannedNames)) ?? [];
    const positions = pathway ? await getPublicPositions() : [];
    const position = positions.find((candidate) => candidate.title === (pathway?.title ?? plan.pathway_title));

    return {
      href: position ? `/opportunities/${position.id}` : pathwayHref(plan.pathway_key),
      linkLabel: position ? "View role requirements" : "Open pathway details",
      itemLabel: "Requirements for this route",
      items,
    };
  }

  const pathway = getStaticOccupationPathway(plan.pathway_key);
  const completedActions = new Set(plan.completed_action_ids);
  const items = pathway?.actions
    .filter((action) => action.isActive)
    .sort((first, second) => first.sortOrder - second.sortOrder)
    .map((action): SavedPathwayItem => ({
      id: action.id,
      kind: "action",
      name: action.title,
      detail: action.instruction,
      mandatory: false,
      minimumYears: null,
      supportingText: action.organizationName ? `Continue with ${action.organizationName}` : null,
      status: completedActions.has(action.id) ? "complete" : "available",
    })) ?? [];

  return {
    href: pathwayHref(plan.pathway_key),
    linkLabel: "Open pathway details",
    itemLabel: "Next steps for this pathway",
    items,
  };
}
