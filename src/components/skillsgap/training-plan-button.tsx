"use client";

import { useState } from "react";

import { startTrainingPlan } from "@/lib/skillsgap/actions";

export function TrainingPlanButton({ qualification, gapId }: { qualification: string; gapId?: string }) {
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function start() {
    if (!gapId) { setStarted(true); return; }
    const result = await startTrainingPlan(gapId);
    if (result.error) { setError(result.error); return; }
    setStarted(true);
  }
  return <div className="flex flex-col items-end gap-1"><button type="button" onClick={() => { void start(); }} className={`min-h-10 px-4 text-sm font-semibold ${started ? "bg-emerald-700 text-white" : "border border-accent text-accent hover:bg-teal-50"}`}>{started ? "Plan started" : `Plan ${qualification}`}</button>{error ? <span className="text-xs text-danger" role="alert">{error}</span> : null}</div>;
}
