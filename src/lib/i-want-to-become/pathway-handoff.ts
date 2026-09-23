import { parsePathwayPlanDraft, type PathwayPlanDraft } from "@/lib/i-want-to-become/pathway-plan";

export const pendingPathwayPlanStorageKey = "skillsgap:i-want-to-become:pending-save";
export const explorerDraftStorageKey = "skillsgap:i-want-to-become:draft";
export const pathwaySaveOAuthCallbackPath = "/i-want-to-become?save=pathway";

export function pathwaySaveReturnPath(token: string) {
  return `/i-want-to-become?save=pathway&handoff=${encodeURIComponent(token)}`;
}

export function isPathwayHandoffToken(value: string) {
  return /^[A-Za-z0-9_-]{43}$/.test(value);
}

export function getPathwayHandoffTokenFromReturnPath(value: string) {
  try {
    const url = new URL(value, "https://pathway.invalid");
    const tokens = url.searchParams.getAll("handoff");
    if (url.origin !== "https://pathway.invalid" || url.pathname !== "/i-want-to-become"
      || url.searchParams.getAll("save").length !== 1 || url.searchParams.get("save") !== "pathway"
      || tokens.length !== 1 || !isPathwayHandoffToken(tokens[0])) return null;
    return tokens[0];
  } catch {
    return null;
  }
}

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
  try {
    localStorage.removeItem(pendingPathwayPlanStorageKey);
  } catch {
    // Storage can be unavailable in private browsing; the server save already succeeded.
  }
  try {
    sessionStorage.removeItem(explorerDraftStorageKey);
    const progressKey = draft.pathwayKind === "guided"
      ? `skillsgap:i-want-to-become:planned-requirements:${draft.pathwayKey}`
      : `skillsgap:i-want-to-become:completed-actions:${draft.pathwayKey}`;
    sessionStorage.removeItem(progressKey);
  } catch {
    // Do not block the dashboard redirect after a successful server-side save.
  }
}
