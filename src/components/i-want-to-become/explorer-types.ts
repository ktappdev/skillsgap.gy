import type { CsecResult } from "@/lib/i-want-to-become/catalog";

export type ExplorerStep = 1 | 2 | 3;
export type PhotoState = "idle" | "reading" | "ready" | "manual";
export type PlanSource = "live" | "fallback";

export type ExplorerDraft = {
  careerId: string;
  interests: string;
  selectedInterests: string[];
  results: CsecResult[];
  step: ExplorerStep;
  showPlan: boolean;
};
