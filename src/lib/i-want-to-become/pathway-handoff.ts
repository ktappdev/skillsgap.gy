import { parsePathwayPlanDraft, type PathwayPlanDraft } from "@/lib/i-want-to-become/pathway-plan";

export const pendingPathwayPlanStorageKey = "skillsgap:i-want-to-become:pending-save";
export const explorerDraftStorageKey = "skillsgap:i-want-to-become:draft";
export const pathwaySaveReturnPath = "/i-want-to-become?save=pathway";

export function storePendingPathwayPlan(storage: Storage, draft: PathwayPlanDraft): boolean {
  try {
    storage.setItem(pendingPathwayPlanStorageKey, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function readPendingPathwayPlan(storage: Storage, now = Date.now()): PathwayPlanDraft | null {
  const stored = storage.getItem(pendingPathwayPlanStorageKey);
  if (!stored) return null;
  try {
    const draft = parsePathwayPlanDraft(JSON.parse(stored) as unknown, { enforceFreshness: true, now });
    if (!draft) storage.removeItem(pendingPathwayPlanStorageKey);
    return draft;
  } catch {
    storage.removeItem(pendingPathwayPlanStorageKey);
    return null;
  }
}

export function clearSavedPathwayBrowserState(localStorage: Storage, sessionStorage: Storage, draft: PathwayPlanDraft) {
  localStorage.removeItem(pendingPathwayPlanStorageKey);
  sessionStorage.removeItem(explorerDraftStorageKey);
  const progressKey = draft.pathwayKind === "guided"
    ? `skillsgap:i-want-to-become:planned-requirements:${draft.pathwayKey}`
    : `skillsgap:i-want-to-become:completed-actions:${draft.pathwayKey}`;
  sessionStorage.removeItem(progressKey);
}
