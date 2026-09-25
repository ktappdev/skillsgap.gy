import { describe, expect, it } from "vitest";

import { getStaticOccupationPathway } from "@/lib/i-want-to-become/occupations";
import {
  clearSavedPathwayBrowserState,
  explorerDraftStorageKey,
  getPathwayHandoffTokenFromReturnPath,
  pendingPathwayPlanStorageKey,
  readPendingPathwayPlan,
  isPathwayHandoffToken,
  pathwaySaveReturnPath,
  storePendingPathwayPlan,
} from "@/lib/i-want-to-become/pathway-handoff";
import { createPathwayPlanDraft, parsePathwayPlanDraft, pathwayPlanLifetimeMs } from "@/lib/i-want-to-become/pathway-plan";
import { validateGuidedPathwayPlan, validateOccupationPathwayPlan } from "@/lib/i-want-to-become/pathway-validation";

const now = Date.parse("2026-09-06T07:00:00.000Z");

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key) {
      return values.get(key) ?? null;
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

function guidedDraft() {
  return createPathwayPlanDraft({
    pathwayKind: "guided",
    pathwayKey: "trainee-offshore-mechanical-technician",
    interests: "I like repairing machines.",
    selectedInterests: ["Fixing things"],
    results: [{ subject: "Mathematics", grade: "2" }],
    plannedRequirementNames: ["Mechanical Maintenance"],
    completedActionIds: [],
  }, now);
}

describe("pathway plan handoff", () => {
  it("puts only an opaque handoff token in the auth return path", () => {
    const token = "a".repeat(43);
    const returnPath = pathwaySaveReturnPath(token);
    expect(returnPath).toBe(`/i-want-to-become?save=pathway&handoff=${token}`);
    expect(returnPath).not.toContain("Mathematics");
    expect(isPathwayHandoffToken(token)).toBe(true);
    expect(isPathwayHandoffToken(`${token}x`)).toBe(false);
    expect(getPathwayHandoffTokenFromReturnPath(returnPath)).toBe(token);
    expect(getPathwayHandoffTokenFromReturnPath(`/i-want-to-become?save=pathway&handoff=${token}&handoff=${token}`)).toBeNull();
    expect(getPathwayHandoffTokenFromReturnPath(`/i-want-to-become?save=other&handoff=${token}`)).toBeNull();
  });
  it("round-trips a valid private planning draft", () => {
    const draft = guidedDraft();
    const storage = createMemoryStorage();
    expect(storePendingPathwayPlan(storage, draft)).toBe(true);
    expect(readPendingPathwayPlan(storage, now)).toEqual(draft);
  });

  it("removes expired and malformed pending drafts", () => {
    const draft = guidedDraft();
    const storage = createMemoryStorage();
    storage.setItem(pendingPathwayPlanStorageKey, JSON.stringify(draft));
    expect(readPendingPathwayPlan(storage, now + pathwayPlanLifetimeMs + 1)).toBeNull();
    expect(storage.getItem(pendingPathwayPlanStorageKey)).toBeNull();
    storage.setItem(pendingPathwayPlanStorageKey, "not-json");
    expect(readPendingPathwayPlan(storage, now)).toBeNull();
  });

  it("rejects cross-kind progress and oversized inputs", () => {
    expect(parsePathwayPlanDraft({ ...guidedDraft(), completedActionIds: ["wrong-kind"] })).toBeNull();
    expect(parsePathwayPlanDraft({ ...guidedDraft(), interests: "x".repeat(1001) })).toBeNull();
  });

  it("clears only the saved route browser keys after success", () => {
    const draft = guidedDraft();
    const localStorage = createMemoryStorage();
    const sessionStorage = createMemoryStorage();
    localStorage.setItem(pendingPathwayPlanStorageKey, JSON.stringify(draft));
    sessionStorage.setItem(explorerDraftStorageKey, "draft");
    sessionStorage.setItem(`skillsgap:i-want-to-become:planned-requirements:${draft.pathwayKey}`, "progress");
    sessionStorage.setItem("unrelated", "keep");
    clearSavedPathwayBrowserState(localStorage, sessionStorage, draft);
    expect(localStorage.getItem(pendingPathwayPlanStorageKey)).toBeNull();
    expect(sessionStorage.getItem(explorerDraftStorageKey)).toBeNull();
    expect(sessionStorage.getItem("unrelated")).toBe("keep");
  });
});

describe("pathway plan canonical validation", () => {
  it("normalizes legacy interests and keeps only five", () => {
    const parsed = createPathwayPlanDraft({
      pathwayKind: "guided",
      pathwayKey: "trainee-offshore-mechanical-technician",
      interests: "",
      selectedInterests: ["Fixing things", "Safety", "Numbers", "Science", "Working outdoors", "Organising", "Working with people"],
      results: [],
      plannedRequirementNames: [],
      completedActionIds: [],
    }, now);
    expect(parsed.selectedInterests).toEqual(["machinery-repair", "safety", "finance", "testing-science", "outdoor-work"]);
  });

  it("accepts known guided requirements and rejects unknown ones", () => {
    expect(validateGuidedPathwayPlan(guidedDraft())?.pathwayTitle).toBe("Trainee Offshore Mechanical Technician");
    expect(validateGuidedPathwayPlan({ ...guidedDraft(), plannedRequirementNames: ["Invented requirement"] })).toBeNull();
  });

  it("accepts known occupation actions and rejects unknown ones", () => {
    const pathway = getStaticOccupationPathway("cooks");
    expect(pathway).not.toBeNull();
    if (!pathway) return;
    const draft = createPathwayPlanDraft({
      pathwayKind: "occupation",
      pathwayKey: pathway.slug,
      interests: "",
      selectedInterests: [],
      results: [],
      plannedRequirementNames: [],
      completedActionIds: [pathway.actions[0].id],
    }, now);
    expect(validateOccupationPathwayPlan(draft, pathway)?.pathwayTitle).toBe(pathway.title);
    expect(validateOccupationPathwayPlan({ ...draft, completedActionIds: ["invented-action"] }, pathway)).toBeNull();
  });
});
