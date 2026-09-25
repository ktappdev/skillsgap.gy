import { isValidCsecResult, type CsecResult } from "@/lib/i-want-to-become/catalog";
import { normalizeCareerInterest } from "@/lib/i-want-to-become/interests";

export const pathwayPlanVersion = 1 as const;
export const pathwayPlanLifetimeMs = 24 * 60 * 60 * 1000;

export type PathwayKind = "guided" | "occupation";
export type PathwaySaveViewer = "anonymous" | "applicant" | "other";

export type PathwayPlanDraft = {
  version: typeof pathwayPlanVersion;
  createdAt: string;
  pathwayKind: PathwayKind;
  pathwayKey: string;
  interests: string;
  selectedInterests: string[];
  results: CsecResult[];
  plannedRequirementNames: string[];
  completedActionIds: string[];
};

export type PathwayPlanInput = Omit<PathwayPlanDraft, "version" | "createdAt">;

type ParsePathwayPlanOptions = {
  enforceFreshness?: boolean;
  now?: number;
};

function readStringArray(value: unknown, maximumItems: number, maximumLength: number): string[] | null {
  if (!Array.isArray(value) || value.length > maximumItems) return null;
  const cleaned = value.flatMap((item): string[] => {
    if (typeof item !== "string") return [];
    const trimmed = item.trim();
    return trimmed && trimmed.length <= maximumLength ? [trimmed] : [];
  });
  if (cleaned.length !== value.length) return null;
  return [...new Set(cleaned)];
}

function readResults(value: unknown): CsecResult[] | null {
  if (!Array.isArray(value) || value.length > 20) return null;
  const results = value.flatMap((item): CsecResult[] => {
    if (typeof item !== "object" || item === null) return [];
    const result = item as Record<string, unknown>;
    if (typeof result.subject !== "string" || typeof result.grade !== "string") return [];
    const candidate = { subject: result.subject.trim(), grade: result.grade.trim() };
    return candidate.subject.length <= 80 && candidate.grade.length <= 20 && isValidCsecResult(candidate) ? [candidate] : [];
  });
  return results.length === value.length ? results : null;
}

export function parsePathwayPlanDraft(value: unknown, options: ParsePathwayPlanOptions = {}): PathwayPlanDraft | null {
  if (typeof value !== "object" || value === null) return null;
  const draft = value as Record<string, unknown>;
  if (draft.version !== pathwayPlanVersion || typeof draft.createdAt !== "string") return null;
  if (draft.pathwayKind !== "guided" && draft.pathwayKind !== "occupation") return null;
  if (typeof draft.pathwayKey !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.pathwayKey) || draft.pathwayKey.length > 120) return null;
  if (typeof draft.interests !== "string" || draft.interests.trim().length > 1000) return null;

  const createdAt = Date.parse(draft.createdAt);
  if (!Number.isFinite(createdAt)) return null;
  if (options.enforceFreshness) {
    const now = options.now ?? Date.now();
    if (createdAt > now + 5 * 60 * 1000 || now - createdAt > pathwayPlanLifetimeMs) return null;
  }

  const selectedInterests = readStringArray(draft.selectedInterests, 12, 80);
  const results = readResults(draft.results);
  const plannedRequirementNames = readStringArray(draft.plannedRequirementNames, 20, 160);
  const completedActionIds = readStringArray(draft.completedActionIds, 20, 160);
  if (!selectedInterests || !results || !plannedRequirementNames || !completedActionIds) return null;
  if (draft.pathwayKind === "guided" && completedActionIds.length > 0) return null;
  if (draft.pathwayKind === "occupation" && plannedRequirementNames.length > 0) return null;

  return {
    version: pathwayPlanVersion,
    createdAt: new Date(createdAt).toISOString(),
    pathwayKind: draft.pathwayKind,
    pathwayKey: draft.pathwayKey,
    interests: draft.interests.trim(),
    selectedInterests: [...new Set(selectedInterests.map(normalizeCareerInterest))].slice(0, 5),
    results,
    plannedRequirementNames,
    completedActionIds,
  };
}

export function createPathwayPlanDraft(input: PathwayPlanInput, now = Date.now()): PathwayPlanDraft {
  const draft = parsePathwayPlanDraft({
    ...input,
    version: pathwayPlanVersion,
    createdAt: new Date(now).toISOString(),
  });
  if (!draft) throw new Error("Pathway plan draft is invalid");
  return draft;
}
