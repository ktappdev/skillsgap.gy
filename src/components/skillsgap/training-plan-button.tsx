"use client";

import { useState } from "react";

import { Tooltip } from "@/components/ui/tooltip";
import { startTrainingPlan } from "@/lib/skillsgap/actions";

export function TrainingPlanButton({ qualification, gapId, initialStatus }: { qualification: string; gapId?: string; initialStatus?: "unresolved" | "plan_started" | "completed" | "resolved" }) {
  const [started, setStarted] = useState(initialStatus === "plan_started");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function start() {
    if (started || saving) return;
    setError(null);
    setSaving(true);
    try {
      if (!gapId) {
        setStarted(true);
        return;
      }
      const result = await startTrainingPlan(gapId);
      if (result.error) {
        if (process.env.NODE_ENV !== "production") console.warn("[pdbg] training-plan-button.tsx: startTrainingPlan returned an error", result.error);
        setError(result.error);
        return;
      }
      setStarted(true);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") console.error("[pdbg] training-plan-button.tsx: startTrainingPlan rejected", error);
      setError("We couldn’t start that plan. Please try again.");
    } finally {
      setSaving(false);
    }
  }
  return <div className="flex flex-col items-end gap-1"><Tooltip label="Marks this gap as a plan you have started, so you can find it again. It does not enrol you, add the skill, or change your match."><button type="button" onClick={() => { void start(); }} disabled={started || saving} aria-busy={saving} className={`min-h-10 px-4 text-sm font-semibold disabled:cursor-wait disabled:opacity-70 ${started ? "bg-emerald-700 text-white" : "border border-accent text-accent hover:bg-teal-50"}`}>{saving ? "Starting plan…" : started ? "Plan started" : `Plan ${qualification}`}</button></Tooltip>{error ? <span className="text-xs text-danger" role="alert">{error}</span> : null}</div>;
}
